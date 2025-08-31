import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowRight, TrendingUp, Users, Zap } from 'lucide-react';

const Featured = () => {
  const featuredItems = [
    {
      id: 1,
      type: 'Case Study',
      title: 'E-commerce AI Assistant Increases Sales by 340%',
      excerpt: 'How we helped an online retailer automate customer support and personalize shopping experiences, resulting in significant revenue growth.',
      date: '2024-01-15',
      readTime: '5 min read',
      icon: TrendingUp,
      tags: ['E-commerce', 'Customer Support', 'ROI']
    },
    {
      id: 2,
      type: 'Blog',
      title: 'The Future of AI Agents in Small Business Operations',
      excerpt: 'Exploring how AI agents are transforming the way small businesses operate, from lead generation to customer retention.',
      date: '2024-01-10',
      readTime: '7 min read',
      icon: Users,
      tags: ['Small Business', 'Automation', 'Strategy']
    },
    {
      id: 3,
      type: 'Case Study',
      title: 'Agency Workflow Automation: 80% Time Savings',
      excerpt: 'Discover how a digital marketing agency streamlined their entire workflow with custom AI agents, dramatically reducing manual work.',
      date: '2024-01-08',
      readTime: '6 min read',
      icon: Zap,
      tags: ['Agency', 'Workflow', 'Productivity']
    }
  ];

  return (
    <section className="section-padding bg-background">
      <div className="container">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Featured <span className="text-gradient">Case Studies & Blogs</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real results from real businesses. Explore our latest success stories and insights 
            into the world of AI automation.
          </p>
        </div>

        {/* Featured Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Card 
                key={item.id} 
                className="group cursor-pointer transition-all duration-300 hover:shadow-card hover:-translate-y-1 border-border/50"
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="secondary" 
                      className="bg-primary/10 text-primary border-0"
                    >
                      {item.type}
                    </Badge>
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {item.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <CardDescription className="text-base leading-relaxed">
                    {item.excerpt}
                  </CardDescription>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="outline" 
                        className="text-xs border-primary/20 text-primary/80"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Meta information */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(item.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}</span>
                      <span>•</span>
                      <span>{item.readTime}</span>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-0 h-auto text-primary hover:text-primary/80 group-hover:translate-x-1 transition-all"
                    >
                      Read More
                      <ArrowRight className="ml-1 w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button 
            variant="outline" 
            size="lg"
            className="border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all duration-300"
          >
            View All Case Studies & Blogs
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Featured;