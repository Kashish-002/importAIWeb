import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg shadow-sm p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                  Welcome back, {user?.name || user?.email}!
                </p>
              </div>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-primary/5 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Profile</h3>
                <p className="text-muted-foreground text-sm">
                  Manage your account settings and preferences.
                </p>
              </div>
              
              <div className="bg-primary/5 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Projects</h3>
                <p className="text-muted-foreground text-sm">
                  View and manage your active projects.
                </p>
              </div>
              
              <div className="bg-primary/5 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Analytics</h3>
                <p className="text-muted-foreground text-sm">
                  Track your performance and insights.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;