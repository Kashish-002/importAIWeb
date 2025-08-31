import { Brain, Zap, Target } from 'lucide-react';

const Introduction = () => {
  return (
    <section className="section-padding bg-muted/30">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Revolutionizing Business with{' '}
                <span className="text-gradient">Smart AI Solutions</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                At Import AI, we specialize in creating custom AI agents that understand your unique business needs. 
                Our solutions aren't just cutting-edge technology—they're practical tools designed to solve real problems 
                and deliver measurable results from day one.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Intelligent Automation</h3>
                  <p className="text-muted-foreground">
                    Our AI agents learn your processes and automate repetitive tasks, 
                    freeing your team to focus on strategic growth.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Rapid Implementation</h3>
                  <p className="text-muted-foreground">
                    See results in days, not months. Our streamlined approach ensures 
                    quick deployment without compromising on quality.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Measurable Impact</h3>
                  <p className="text-muted-foreground">
                    Every solution comes with clear metrics and ROI tracking, 
                    so you always know the value we're delivering.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Illustration placeholder */}
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary-variant/20 rounded-3xl p-8 flex items-center justify-center">
              <div className="w-full h-full bg-card rounded-2xl shadow-card flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Brain className="w-12 h-12 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-foreground">AI Agent Network</div>
                    <div className="text-xs text-muted-foreground">Intelligent • Adaptive • Efficient</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-primary rounded-full animate-pulse" />
            <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-primary-variant rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 -left-8 w-4 h-4 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Introduction;