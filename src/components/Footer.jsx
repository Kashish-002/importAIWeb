const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary">Import AI</span>
            </div>
            <p className="text-secondary-foreground/80 max-w-md">
              Custom AI agents for startups, solo founders, and agencies. 
              Delivering measurable wins in days, not months.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#services" className="text-secondary-foreground/80 hover:text-primary transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="#case-studies" className="text-secondary-foreground/80 hover:text-primary transition-colors">
                  Case Studies
                </a>
              </li>
              <li>
                <a href="#blog" className="text-secondary-foreground/80 hover:text-primary transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#about" className="text-secondary-foreground/80 hover:text-primary transition-colors">
                  About
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a href="/privacy" className="text-secondary-foreground/80 hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/contact" className="text-secondary-foreground/80 hover:text-primary transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-secondary-foreground/20 mt-8 pt-8 text-center">
          <p className="text-secondary-foreground/60">
            © 2024 Import AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;