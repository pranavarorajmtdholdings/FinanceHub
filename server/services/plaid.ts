import { PlaidApi, Configuration, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { storage } from '../storage';

class PlaidService {
  private client: PlaidApi;

  constructor() {
    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
      throw new Error('PLAID_CLIENT_ID and PLAID_SECRET environment variables are required');
    }

    const configuration = new Configuration({
      basePath: PlaidEnvironments.production, // Use production environment
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': process.env.PLAID_SECRET,
        },
      },
    });
    this.client = new PlaidApi(configuration);
  }

  async createLinkToken(userId: string): Promise<string> {
    try {
      const response = await this.client.linkTokenCreate({
        user: { client_user_id: userId },
        client_name: 'FinanceHub',
        products: [Products.Transactions],
        country_codes: [CountryCode.Us],
        language: 'en',
      });
      return response.data.link_token;
    } catch (error) {
      console.error('Error creating link token:', error);
      throw new Error('Failed to create link token');
    }
  }

  async exchangePublicToken(publicToken: string, userId: string) {
    try {
      // Exchange public token for access token
      const exchangeResponse = await this.client.itemPublicTokenExchange({
        public_token: publicToken,
      });

      const accessToken = exchangeResponse.data.access_token;
      const itemId = exchangeResponse.data.item_id;

      // Get institution info
      const itemResponse = await this.client.itemGet({
        access_token: accessToken,
      });

      const institutionId = itemResponse.data.item.institution_id;
      let institution = null;

      if (institutionId) {
        const institutionResponse = await this.client.institutionsGetById({
          institution_id: institutionId,
          country_codes: [CountryCode.Us],
        });

        institution = institutionResponse.data.institution;
        
        // Store or update institution
        await storage.createOrUpdateInstitution({
          id: institution.institution_id,
          name: institution.name,
          logo: institution.logo || null,
          primaryColor: institution.primary_color || null,
          url: institution.url || null,
        });
      }

      // Store Plaid item
      await storage.createPlaidItem({
        userId,
        plaidItemId: itemId,
        accessToken,
        institutionId: institutionId || null,
      });

      // Fetch and store accounts
      const accountsResponse = await this.client.accountsGet({
        access_token: accessToken,
      });

      const accounts = [];
      for (const account of accountsResponse.data.accounts) {
        const newAccount = await storage.createAccount({
          userId,
          institutionId: institutionId || null,
          plaidAccountId: account.account_id,
          name: account.name,
          officialName: account.official_name || null,
          accountType: this.mapPlaidAccountType(account.type),
          accountSubtype: this.mapPlaidAccountSubtype(account.subtype),
          mask: account.mask || null,
          currentBalance: account.balances.current?.toString() || '0',
          availableBalance: account.balances.available?.toString() || null,
          creditLimit: account.balances.limit?.toString() || null,
          isManual: false,
        });
        accounts.push(newAccount);
      }

      return {
        success: true,
        accounts,
        institution,
      };
    } catch (error) {
      console.error('Error exchanging public token:', error);
      throw new Error('Failed to exchange public token');
    }
  }

  async refreshAccounts(userId: string) {
    try {
      const plaidItems = await storage.getPlaidItemsByUserId(userId);
      const refreshedAccounts = [];

      for (const item of plaidItems) {
        try {
          const accountsResponse = await this.client.accountsGet({
            access_token: item.accessToken,
          });

          for (const plaidAccount of accountsResponse.data.accounts) {
            // Find existing account by plaidAccountId
            const accounts = await storage.getAccountsByUserId(userId);
            const existingAccount = accounts.find(acc => acc.plaidAccountId === plaidAccount.account_id);

            if (existingAccount) {
              const updatedAccount = await storage.updateAccount(existingAccount.id, {
                currentBalance: plaidAccount.balances.current?.toString() || '0',
                availableBalance: plaidAccount.balances.available?.toString() || null,
                creditLimit: plaidAccount.balances.limit?.toString() || null,
              });
              refreshedAccounts.push(updatedAccount);
            }
          }

          // Update last sync time
          await storage.updatePlaidItem(item.id, {});
        } catch (error) {
          console.error(`Error refreshing accounts for item ${item.plaidItemId}:`, error);
        }
      }

      return {
        success: true,
        refreshedCount: refreshedAccounts.length,
      };
    } catch (error) {
      console.error('Error refreshing accounts:', error);
      throw new Error('Failed to refresh accounts');
    }
  }

  private mapPlaidAccountType(plaidType: string): "checking" | "savings" | "investment" | "credit" {
    switch (plaidType) {
      case 'depository':
        return 'checking'; // Will be refined by subtype
      case 'investment':
        return 'investment';
      case 'credit':
        return 'credit';
      default:
        return 'checking';
    }
  }

  private mapPlaidAccountSubtype(plaidSubtype: string | null): "checking" | "savings" | "401k" | "ira" | "brokerage" | "credit_card" | "line_of_credit" {
    if (!plaidSubtype) return 'checking';
    
    switch (plaidSubtype) {
      case 'savings':
        return 'savings';
      case '401k':
        return '401k';
      case 'ira':
        return 'ira';
      case 'brokerage':
        return 'brokerage';
      case 'credit card':
        return 'credit_card';
      case 'line of credit':
        return 'line_of_credit';
      default:
        return 'checking';
    }
  }
}

export const plaidClient = new PlaidService();
