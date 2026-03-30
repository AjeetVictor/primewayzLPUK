import { Twitter, Github, Linkedin, Phone, Mail } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="py-16 bg-zinc-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          <div className="col-span-1 sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="relative w-8 h-8">
                <svg viewBox="0 0 40 40" className="w-full h-full">
                  <rect x="8" y="8" width="6" height="24" rx="1" fill="#1B59A7" />
                  <path d="M14 10C22 10 28 14 28 20C28 26 22 30 14 30" fill="none" stroke="#E61E50" strokeWidth="6" strokeLinecap="round" />
                  <circle cx="21" cy="20" r="3" fill="#E61E50" />
                </svg>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">Primewayz</span>
            </div>
            <p className="text-zinc-400 max-w-sm mb-6">
              Outsource your software product development with predictable, 
              high-velocity engineering teams. We transform ideas into market-ready products.
            </p>
            
            <div className="space-y-3 mb-8">
              <a href="tel:+919717132668" className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors text-sm">
                <Phone className="w-4 h-4 text-emerald-500" />
                +91 97171 32668
              </a>
              <a href="mailto:info@primewayz.com" className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors text-sm">
                <Mail className="w-4 h-4 text-emerald-500" />
                info@primewayz.com
              </a>
            </div>

            <div className="flex items-center gap-4">
              <a href="#" className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-6">Product</h4>
            <ul className="space-y-4 text-zinc-400">
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#success-stories" className="hover:text-white transition-colors">Success Stories</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-6">Legal</h4>
            <ul className="space-y-4 text-zinc-400">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>

          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <h4 className="text-sm font-bold uppercase tracking-wider mb-6">Global Presence</h4>
            <div className="space-y-6">
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">India</div>
                <p className="text-xs text-zinc-500 leading-relaxed">Office 911, Galaxy Diamond Plaza, Greater Noida West, UP 201318</p>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">US</div>
                <p className="text-xs text-zinc-500 leading-relaxed">3770, Aristotle Ave, Orlando, Florida</p>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Singapore</div>
                <p className="text-xs text-zinc-500 leading-relaxed">Block 685, Floor 12-330, Racecourse Road, 210685</p>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Poland</div>
                <p className="text-xs text-zinc-500 leading-relaxed">Aleja Hallera – 9/182, Wroclaw</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-800 text-center text-zinc-500 text-sm">
          <p>© {new Date().getFullYear()} Primewayz Infotech Pvt. Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
