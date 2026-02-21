import React from "react";
import HeroSection from "@/components/hero";
import {
  featuresData,
  howItWorksData,
  testimonialsData,
  statsData,
} from "@/data/landing";
import { Badge } from "@/components/ui/badge";
import ApiPingButton from "@/components/api-ping-button";

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <HeroSection />

      {/* Stats Section */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {statsData.map((stat, index) => (
              <div key={index} className="p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">Features</Badge>
            <h2 className="text-3xl font-bold mb-4">
              Everything You Need to Manage Your Finances
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform provides all the tools you need to track, analyze,
              and optimize your financial life.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresData.map((feature, index) => (
              <div
                key={index}
                className="p-6 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Optional: show DB Ping only when explicitly enabled (e.g., during troubleshooting) */}
        {process.env.NEXT_PUBLIC_SHOW_DB_PING === "true" && (
          <div className="max-w-md mx-auto mt-12">
            <ApiPingButton />
          </div>
        )}
      </section>
    </div>
  );
}
    