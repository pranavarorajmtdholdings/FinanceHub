import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TriggeredAlert {
  id: string;
  alertId: string;
  triggeredAt: Date | null;
  isRead: boolean;
  message: string;
}

export default function NavigationHeader() {
  const [location] = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  const navItems = [
    { path: "/", label: "Dashboard", testId: "nav-dashboard" },
    { path: "/alerts", label: "Alerts", testId: "nav-alerts" },
    { path: "/collections", label: "Collections", testId: "nav-collections" },
    { path: "/analytics", label: "Analytics", testId: "nav-analytics" },
  ];

  const { data: triggeredAlerts = [] } = useQuery<TriggeredAlert[]>({
    queryKey: ["/api/alerts/triggered"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = triggeredAlerts.filter((a: TriggeredAlert) => !a.isRead).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/alerts/triggered/${id}/read`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/triggered"] });
    },
  });

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm" data-testid="navigation-header">
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer" data-testid="logo-section">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-foreground">FinanceHub</h1>
              </div>
            </Link>
            <nav className="hidden md:flex items-center space-x-1" data-testid="navigation-menu">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <span
                    className={`px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer inline-block ${
                      location === item.path
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    data-testid={item.testId}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4" data-testid="header-actions">
            <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <PopoverTrigger asChild>
                <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors" data-testid="notifications-button">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center px-1" data-testid="notifications-badge">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-0" align="end" data-testid="notifications-popover">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                  </p>
                </div>
                <ScrollArea className="h-[400px]">
                  {triggeredAlerts.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground" data-testid="no-notifications">
                      <Bell className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {triggeredAlerts.map((alert: TriggeredAlert) => (
                        <div
                          key={alert.id}
                          className={`p-4 hover:bg-muted/50 transition-colors ${!alert.isRead ? 'bg-primary/5' : ''}`}
                          data-testid={`notification-${alert.id}`}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <p className={`text-sm flex-1 ${!alert.isRead ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                              {alert.message}
                            </p>
                            {!alert.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto py-1 px-2 text-xs"
                                onClick={() => handleMarkAsRead(alert.id)}
                                data-testid={`button-mark-read-${alert.id}`}
                              >
                                Mark read
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(alert.triggeredAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm" data-testid="user-avatar">
              JD
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
