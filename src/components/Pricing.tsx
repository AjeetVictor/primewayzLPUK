import { motion } from 'motion/react';
import { Check, ArrowRight, Star, Zap, Users, Shield, Clock, Rocket, Plus, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { PricingVisual } from './PricingVisual';

const plans = [
  {
    name: 'STARTER',
    price: '2,000 - 10,000',
    description: 'For small businesses & professionals.',
    features: [
      'Modern Responsive Website',
      'CMS for content/images',
      'SEO + GEO configuration',
      'Social media integration',
      'Weekly 2 content posts',
      'Hosting up to 10GB free',
      '1 active task at a time',
    ],
    color: 'bg-white border-zinc-200',
    buttonColor: 'bg-zinc-900 text-white hover:bg-zinc-800',
  },
  {
    name: 'GROWTH',
    price: '10,000 - 25,000',
    description: 'For growing companies needing automation.',
    features: [
      'Everything in Starter +',
      'Ecommerce (products/services)',
      'Payment gateway integration',
      'Marketing automation',
      'CRM & API connections',
      'Hosting up to 25GB',
      '2 concurrent workflow stages',
    ],
    color: 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500',
    buttonColor: 'bg-emerald-600 text-white hover:bg-emerald-700',
    popular: true,
  },
  {
    name: 'SCALE',
    price: '25,000 - 75,000',
    description: 'For serious operational systems.',
    features: [
      'Accounting / Finance systems',
      'Custom admin panels',
      'ERP modules',
      'Workflow automation',
      'Mobile-ready systems',
      'Priority queue',
      'Dedicated architect',
    ],
    color: 'bg-white border-zinc-200',
    buttonColor: 'bg-zinc-900 text-white hover:bg-zinc-800',
  },
];

const enterprisePlan = {
  name: 'ENTERPRISE',
  price: '4,00,000+',
  description: 'Advanced Platforms & SaaS.',
  features: [
    'High-availability architecture',
    'Microservices & AI integrations',
    'Compliance-ready systems',
    'Data pipelines',
    'Multi-resource execution',
    'Sprint planning & Release cycles',
  ],
  color: 'bg-zinc-900 border-zinc-800 text-white',
  buttonColor: 'bg-white text-zinc-900 hover:bg-zinc-100',
};

const addOns = [
  { name: 'Dedicated Frontend Dev', price: '+₹10K' },
  { name: 'Dedicated Backend Dev', price: '+₹20K' },
  { name: 'UI/UX Designer', price: '+₹8K' },
  { name: 'DevOps / Digital Marketing', price: '+₹20K' },
  { name: 'Speed Boost (2x Delivery)', price: '+30-40%' },
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-24 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-4"
          >
            Productized Subscription Tiers
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-600 max-w-2xl mx-auto mb-10"
          >
            Choose the velocity that matches your business stage. 
            Pause anytime - resume later.
          </motion.p>
        </div>

        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
              }}
              className={`relative p-8 rounded-3xl border ${plan.color} flex flex-col hover:shadow-xl transition-shadow duration-300`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider z-10">
                  Most Popular
                </div>
              )}
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-zinc-500 text-sm">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-zinc-900">
                    ₹{plan.price}
                  </span>
                  <span className="text-zinc-500 font-medium">/mo</span>
                </div>
              </div>

              <motion.ul 
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.3,
                    },
                  },
                }}
                className="space-y-4 mb-10 flex-grow"
              >
                {plan.features.map((feature) => (
                  <motion.li 
                    key={feature} 
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      visible: { opacity: 1, x: 0 },
                    }}
                    className="flex items-start gap-3 text-sm text-zinc-600"
                  >
                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                    {feature}
                  </motion.li>
                ))}
              </motion.ul>

              <motion.a 
                href="#contact" 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group shadow-lg shadow-emerald-900/5 ${plan.buttonColor}`}
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>
            </motion.div>
          ))}
        </motion.div>

        {/* Enterprise Plan */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`relative p-8 md:p-12 rounded-[3rem] border ${enterprisePlan.color} mb-24 overflow-hidden`}
        >
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">{enterprisePlan.name}</h3>
              <p className="text-zinc-400 text-lg mb-8">{enterprisePlan.description}</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-bold text-white">₹{enterprisePlan.price}</span>
                <span className="text-zinc-400 font-medium">/mo</span>
              </div>
              <motion.a 
                href="#contact" 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`px-10 py-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group shadow-xl shadow-white/5 ${enterprisePlan.buttonColor}`}
              >
                Contact for Enterprise
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {enterprisePlan.features.map((feature) => (
                <div key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        </motion.div>

        {/* Add-ons Section */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-4">Revenue Multipliers & Add-Ons</h3>
            <p className="text-zinc-600">Scale your capacity with dedicated specialists and speed boosts.</p>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-zinc-200 overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-100">
              <div className="p-8">
                <h4 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  Dedicated Specialists
                </h4>
                <ul className="space-y-4">
                  {addOns.slice(0, 4).map((addon) => (
                    <li key={addon.name} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-600">{addon.name}</span>
                      <span className="font-bold text-zinc-900">{addon.price}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-8 bg-zinc-50/50">
                <h4 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-600" />
                  Speed & Marketing
                </h4>
                <ul className="space-y-4">
                  <li className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600">Speed Boost (2x Delivery)</span>
                    <span className="font-bold text-emerald-600">+30-40%</span>
                  </li>
                  <li className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600">SEO Growth Program</span>
                    <span className="font-bold text-zinc-900">Add-on</span>
                  </li>
                  <li className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600">Performance Marketing</span>
                    <span className="font-bold text-zinc-900">Add-on</span>
                  </li>
                  <li className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600">Content Automation</span>
                    <span className="font-bold text-zinc-900">Add-on</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Delivery Rules */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              'No hourly billing',
              'No unlimited revisions',
              'Approved queue only',
              'One task per lane',
              'Pause anytime',
            ].map((rule) => (
              <div key={rule} className="bg-white border border-zinc-100 p-4 rounded-2xl text-center shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                <span className="text-xs font-bold text-zinc-700 uppercase tracking-tight">{rule}</span>
              </div>
            ))}
          </div>
          
          <PricingVisual />
        </div>
      </div>
    </section>
  );
};
