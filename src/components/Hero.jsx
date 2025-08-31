import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-background section-padding">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary-variant/5" />
      
      <div className="container relative">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI Solutions for Modern Businesses
          </div>

          {/* Main headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Custom AI agents for{' '}
            <span className="text-gradient">startups</span>,{' '}
            <span className="text-gradient">solo founders</span>,{' '}
            and <span className="text-gradient">agencies</span>,{' '}
            measurable wins in days, not months.
          </h1>

          {/* Sub-text */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
            Transform your business with tailored AI solutions that deliver real results. 
            We build custom AI agents that integrate seamlessly with your workflow, 
            helping you automate tasks, enhance productivity, and drive growth.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-elegant transition-all duration-300 hover:shadow-glow group"
            >
              Get Started Today
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all duration-300"
            >
              View Case Studies
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-12 w-full max-w-2xl">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">AI Agents Deployed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">95%</div>
              <div className="text-sm text-muted-foreground">Client Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">7 Days</div>
              <div className="text-sm text-muted-foreground">Average Deployment</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;