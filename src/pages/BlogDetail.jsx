import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowLeft, Star, MessageSquare, User, Clock, TrendingUp, Users, Zap } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const BlogDetail = () => {
  const { slug } = useParams();
  
  // Mock data - in a real app, this would come from your CMS or API
  const blogPosts = {
    'ecommerce-ai-assistant-340-sales-increase': {
      id: 1,
      type: 'Case Study',
      title: 'E-commerce AI Assistant Increases Sales by 340%',
      slug: 'ecommerce-ai-assistant-340-sales-increase',
      excerpt: 'How we helped an online retailer automate customer support and personalize shopping experiences, resulting in significant revenue growth.',
      content: `
        <h2>The Challenge</h2>
        <p>Our client, a mid-sized e-commerce retailer, was struggling with customer support bottlenecks and generic shopping experiences. They were losing potential sales due to slow response times and inability to provide personalized recommendations at scale.</p>
        
        <h2>The Solution</h2>
        <p>We implemented a comprehensive AI assistant system that included:</p>
        <ul>
          <li>Real-time customer support chatbot with natural language processing</li>
          <li>Personalized product recommendation engine</li>
          <li>Automated follow-up email sequences based on customer behavior</li>
          <li>Inventory management integration for real-time availability updates</li>
        </ul>
        
        <h2>The Results</h2>
        <p>Within 6 months of implementation, our client saw remarkable improvements:</p>
        <ul>
          <li><strong>340% increase in sales</strong> from AI-driven recommendations</li>
          <li><strong>85% reduction</strong> in customer support response time</li>
          <li><strong>92% customer satisfaction</strong> rating for AI interactions</li>
          <li><strong>$2.3M additional revenue</strong> in the first year</li>
        </ul>
        
        <h2>Key Takeaways</h2>
        <p>This case study demonstrates the transformative power of AI in e-commerce. By focusing on customer experience and operational efficiency, businesses can achieve remarkable growth while maintaining high service quality.</p>
      `,
      date: '2024-01-15',
      readTime: '5 min read',
      author: 'Sarah Chen',
      rating: 4.8,
      totalReviews: 24,
      comments: 18,
      icon: TrendingUp,
      tags: ['E-commerce', 'Customer Support', 'ROI']
    },
    'future-ai-agents-small-business': {
      id: 2,
      type: 'Blog',
      title: 'The Future of AI Agents in Small Business Operations',
      slug: 'future-ai-agents-small-business',
      excerpt: 'Exploring how AI agents are transforming the way small businesses operate, from lead generation to customer retention.',
      content: `
        <h2>Introduction</h2>
        <p>Small businesses are the backbone of the economy, but they often lack the resources of larger enterprises. AI agents are leveling the playing field by providing sophisticated automation and intelligence at an affordable scale.</p>
        
        <h2>Current Applications</h2>
        <p>Today's AI agents are already helping small businesses in numerous ways:</p>
        <ul>
          <li>Automated lead qualification and nurturing</li>
          <li>Customer service and support automation</li>
          <li>Social media management and content creation</li>
          <li>Inventory management and demand forecasting</li>
        </ul>
        
        <h2>The Future Landscape</h2>
        <p>Looking ahead, AI agents will become even more sophisticated:</p>
        <ul>
          <li><strong>Predictive Analytics:</strong> AI will help predict market trends and customer behavior</li>
          <li><strong>Autonomous Operations:</strong> Full automation of routine business processes</li>
          <li><strong>Personalized Customer Experiences:</strong> AI-driven customization at individual level</li>
          <li><strong>Strategic Decision Making:</strong> AI advisors for business strategy and planning</li>
        </ul>
        
        <h2>Getting Started</h2>
        <p>Small businesses should start with simple implementations and gradually expand their AI capabilities. Focus on areas with the highest impact and clearest ROI first.</p>
      `,
      date: '2024-01-10',
      readTime: '7 min read',
      author: 'Michael Rodriguez',
      rating: 4.6,
      totalReviews: 31,
      comments: 12,
      icon: Users,
      tags: ['Small Business', 'Automation', 'Strategy']
    },
    'agency-workflow-automation-80-time-savings': {
      id: 3,
      type: 'Case Study',
      title: 'Agency Workflow Automation: 80% Time Savings',
      slug: 'agency-workflow-automation-80-time-savings',
      excerpt: 'Discover how a digital marketing agency streamlined their entire workflow with custom AI agents, dramatically reducing manual work.',
      content: `
        <h2>The Challenge</h2>
        <p>A growing digital marketing agency was drowning in manual processes. Their team spent 60% of their time on repetitive tasks like client reporting, social media scheduling, and campaign optimization, leaving little time for strategy and creative work.</p>
        
        <h2>The Solution</h2>
        <p>We developed a comprehensive workflow automation system:</p>
        <ul>
          <li>Automated client reporting with real-time data integration</li>
          <li>AI-powered social media content creation and scheduling</li>
          <li>Campaign performance optimization algorithms</li>
          <li>Automated client communication and follow-ups</li>
          <li>Project management and task allocation system</li>
        </ul>
        
        <h2>Implementation Process</h2>
        <p>The implementation was rolled out in phases over 3 months:</p>
        <ul>
          <li><strong>Phase 1:</strong> Automated reporting and data collection</li>
          <li><strong>Phase 2:</strong> Social media automation and content creation</li>
          <li><strong>Phase 3:</strong> Campaign optimization and client communication</li>
        </ul>
        
        <h2>Results</h2>
        <p>The transformation was remarkable:</p>
        <ul>
          <li><strong>80% reduction</strong> in time spent on manual tasks</li>
          <li><strong>150% increase</strong> in client capacity without hiring</li>
          <li><strong>95% improvement</strong> in reporting accuracy and speed</li>
          <li><strong>$500K additional revenue</strong> from increased capacity</li>
        </ul>
        
        <h2>Lessons Learned</h2>
        <p>Successful automation requires careful planning, gradual implementation, and ongoing optimization. The key is to start with the most time-consuming processes and gradually expand.</p>
      `,
      date: '2024-01-08',
      readTime: '6 min read',
      author: 'Emily Thompson',
      rating: 4.9,
      totalReviews: 19,
      comments: 8,
      icon: Zap,
      tags: ['Agency', 'Workflow', 'Productivity']
    }
  };

  const post = blogPosts[slug];

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
          <Link to="/" className="text-primary hover:underline">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const IconComponent = post.icon;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="section-padding">
        <div className="container max-w-4xl">
          {/* Back Button */}
          <div className="mb-8">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>

          {/* Article Header */}
          <article>
            <header className="mb-8 space-y-6">
              <div className="flex items-center gap-4">
                <Badge 
                  variant="secondary" 
                  className="bg-primary/10 text-primary border-0"
                >
                  {post.type}
                </Badge>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <IconComponent className="w-5 h-5 text-primary" />
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                {post.title}
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed">
                {post.excerpt}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="outline" 
                    className="border-primary/20 text-primary/80"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-t border-b border-border py-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>By {post.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(post.date).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{post.readTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{post.rating} ({post.totalReviews} reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>{post.comments} comments</span>
                </div>
              </div>
            </header>

            {/* Article Content */}
            <div 
              className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <Card className="p-8">
              <CardHeader>
                <CardTitle className="text-2xl">Ready to Transform Your Business?</CardTitle>
                <CardDescription className="text-lg">
                  Get started with AI automation today and see results like our clients.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="lg" className="mx-auto">
                  Schedule a Consultation
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogDetail;