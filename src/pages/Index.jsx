import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Introduction from '@/components/Introduction';
import Featured from '@/components/Featured';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <Hero />
        <Introduction />
        <Featured />
      </main>
      <Footer />
    </div>
  );
};

export default Index;