import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, Globe, Bell } from 'lucide-react';

export const TermsOfService: React.FC = () => {
  return (
    <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
            <Shield size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-display text-[#1F2937] dark:text-white mb-4">Terms of Service</h1>
          <p className="text-[#6B7280] dark:text-slate-400 max-w-2xl mx-auto italic">
            Last Updated: March 19, 2026
          </p>
        </div>

        <section className="glass p-8 md:p-12 rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800">
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            <div className="space-y-4">
              <p className="text-[#1F2937] dark:text-slate-300 leading-relaxed text-lg">
                We place a lot of value on protecting your personal information. These Terms of Service explain how we collect, use, and protect your personal information when you use our services.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 text-[#1F2937] dark:text-white">
                <Globe className="text-primary" size={24} />
                <h2 className="text-2xl font-bold">Collection and Use of Information</h2>
              </div>
              <p className="text-[#6B7280] dark:text-slate-400 leading-relaxed">
                When you use our website or interact with our services, we may collect certain personal information from you. This may include your name, email address, phone number, address, and other information you provide when you register or use our services.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl space-y-3 border border-slate-100 dark:border-slate-800">
                <p className="font-bold text-[#1F2937] dark:text-white mb-2">We may use your personal information to:</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[#6B7280] dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Provide and maintain our services
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Notify us of changes to our services
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Resolve problems or disputes
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Monitor and analyze the use of our services
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Enhance your user experience
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 text-[#1F2937] dark:text-white">
                <Lock className="text-primary" size={24} />
                <h2 className="text-2xl font-bold">Security</h2>
              </div>
              <p className="text-[#6B7280] dark:text-slate-400 leading-relaxed">
                We are committed to protecting your personal information and have taken appropriate security measures to ensure that your information is kept safe when you visit our website.
              </p>
              <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                <p className="text-amber-800 dark:text-amber-400 text-sm leading-relaxed">
                  <strong>Important Note:</strong> However, please remember that no method of transmission over the internet or electronic means is 100% secure or reliable. While we strive to protect your personal information, we cannot ensure or warrant the security of any information you transmit to us or from our services, and you do so at your own risk.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 text-[#1F2937] dark:text-white">
                <Eye className="text-primary" size={24} />
                <h2 className="text-2xl font-bold">Links to Other Websites</h2>
              </div>
              <p className="text-[#6B7280] dark:text-slate-400 leading-relaxed">
                Our website may contain links to other websites that are not operated by us. If you click on a third-party link, you will be directed to that third-party website. We encourage you to review the Privacy Policy of every website you visit, as we have no control over or responsibility for the privacy practices or content of third-party websites or services.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 text-[#1F2937] dark:text-white">
                <Bell className="text-primary" size={24} />
                <h2 className="text-2xl font-bold">Changes to Terms of Service</h2>
              </div>
              <p className="text-[#6B7280] dark:text-slate-400 leading-relaxed">
                We may update our Terms of Service from time to time. We will notify you of any changes by posting the new Terms of Service on this page. It is recommended to check these terms periodically to stay informed of any changes.
              </p>
            </div>
          </div>
        </section>

        <div className="text-center pt-8">
          <p className="text-[#6B7280] dark:text-slate-500 text-sm">
            If you have any questions about these Terms of Service, please contact us at <span className="text-primary font-bold">Veloxmediaservice@yahoo.com</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
