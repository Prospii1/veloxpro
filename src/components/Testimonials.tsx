import React from 'react';
import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Sarah Jenkins',
    role: 'Influencer',
    content: 'VeloxPro transformed my engagement. The followers are high quality and the delivery was instant. Highly recommend!',
    avatar: 'https://picsum.photos/seed/sarah/100/100'
  },
  {
    name: 'Mark Thompson',
    role: 'E-commerce Owner',
    content: 'We used their TikTok services for our product launch and it went viral within 24 hours. Best SMM panel I have ever used.',
    avatar: 'https://picsum.photos/seed/mark/100/100'
  },
  {
    name: 'Elena Rodriguez',
    role: 'Marketing Agency',
    content: 'The API is incredibly stable. We integrated it into our own dashboard and our clients are thrilled with the results.',
    avatar: 'https://picsum.photos/seed/elena/100/100'
  }
];

export const Testimonials: React.FC = () => {
  return (
    <section className="py-20 px-6 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">What Our Clients Say</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">Don't just take our word for it. Join thousands of satisfied customers growing their social presence with us.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass p-8 rounded-[2rem] relative"
            >
              <Quote className="absolute top-6 right-8 text-primary/10" size={48} />
              
              <div className="flex items-center gap-1 text-amber-500 mb-6">
                {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={16} fill="currentColor" />)}
              </div>

              <p className="text-slate-600 dark:text-slate-400 mb-8 italic">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-4">
                <img 
                  src={testimonial.avatar} 
                  alt={testimonial.name} 
                  className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-800"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-bold">{testimonial.name}</h4>
                  <p className="text-xs text-slate-500">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
