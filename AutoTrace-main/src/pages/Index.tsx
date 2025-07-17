
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-theme-darkPurple to-theme-deepPurple flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white font-['Orbitron']">
            <span className="text-theme-lightBrown">A</span>utotrace
          </h1>
        </div>
        <div className="space-x-2">
          {user ? (
            <Button 
              asChild
              variant="outline" 
              className="bg-theme-deepPurple/50 text-white border-theme-lightBrown/30 hover:bg-theme-deepPurple hover:text-white"
            >
              <Link to={user.user_metadata?.role === 'developer' ? '/developer/dashboard' : '/admin/dashboard'}>
                Go to Dashboard
              </Link>
            </Button>
          ) : (
            <div className="space-x-2">
              <Button 
                asChild
                variant="outline" 
                className="text-white border-theme-lightBrown/30 hover:bg-theme-deepPurple/40 hover:text-white"
              >

              </Button>
              <Button 
                asChild
                className="bg-theme-terracotta hover:bg-theme-lightBrown text-white"
              >
                <Link to="/login">Login</Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col justify-center items-center text-center p-6 mt-6 md:mt-0 animate-fade-in">
        <div className="max-w-4xl">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Smart Vehicle Tracking & Monitoring Solution
          </h2>
          <p className="text-lg md:text-xl text-theme-lightBrown/90 mb-8 max-w-2xl mx-auto">
            Real-time GPS tracking, vehicle diagnostics, and analytics for fleet management. Build for safety, efficiency and control.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-theme-terracotta hover:bg-theme-lightBrown text-white px-8 py-6 text-lg">
              <Link to={user ? (user.user_metadata?.role === 'developer' ? '/developer/dashboard' : '/admin/dashboard') : '/login'}>
                {user ? 'Go to Dashboard' : 'Get Started'}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-theme-lightBrown/40 text-white hover:bg-theme-deepPurple/40 px-8 py-6 text-lg">
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 px-6 md:px-10 bg-theme-darkPurple/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
            Advanced Vehicle Management Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Real-Time Tracking",
                description: "Monitor your fleet with precise GPS tracking and instant location updates.",
                icon: "📍"
              },
              {
                title: "Vehicle Diagnostics",
                description: "Get detailed insights into vehicle health and performance metrics.",
                icon: "🔧"
              },
              {
                title: "Alerts & Notifications",
                description: "Receive instant alerts for critical events and anomalies.",
                icon: "🔔"
              },
              {
                title: "Route Optimization",
                description: "Optimize routes for efficiency and reduced fuel consumption.",
                icon: "🛣️"
              },
              {
                title: "Custom Analytics",
                description: "Generate detailed reports on fleet performance and driver behavior.",
                icon: "📊"
              },
              {
                title: "Secure Access Control",
                description: "Control who can access vehicle data with role-based permissions.",
                icon: "🔐"
              }
            ].map((feature, i) => (
              <Card key={i} className="backdrop-blur-sm bg-white/5 border-theme-deepPurple/30 shadow-xl transition-all duration-300 hover:shadow-theme-deepPurple/10 hover:-translate-y-1">
                <CardHeader>
                  <div className="text-3xl mb-2">{feature.icon}</div>
                  <CardTitle className="text-xl text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-theme-lightBrown/80">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-theme-deepPurple text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to transform your fleet management?
          </h2>
          <p className="text-lg text-theme-lightBrown/90 mb-8">
            Join thousands of businesses already using Autotrace to optimize their operations.
          </p>
          
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-theme-darkPurple text-white py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h2 className="text-2xl font-bold font-['Orbitron']">
              <span className="text-theme-lightBrown">A</span>utotrace
            </h2>
          </div>
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-theme-lightBrown/70">
            <a href="#" className="hover:text-theme-lightBrown transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-theme-lightBrown transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-theme-lightBrown transition-colors">Contact Us</a>
          </div>
          <div className="mt-4 md:mt-0 text-sm text-theme-lightBrown/50">
            &copy; {new Date().getFullYear()} Autotrace. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
