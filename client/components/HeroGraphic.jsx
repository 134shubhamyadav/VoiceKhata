export default function HeroGraphic() {
  return (
    <div className="w-full flex justify-center py-6 mb-2">
      <svg
        width="100%"
        height="180"
        viewBox="0 0 500 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="max-w-[320px] drop-shadow-2xl"
      >
        <defs>
          <linearGradient id="bgGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E8F0FE" />
            <stop offset="100%" stopColor="#D2E3FC" />
          </linearGradient>
          <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#669DF6" />
            <stop offset="100%" stopColor="#4285F4" />
          </linearGradient>
          <linearGradient id="plantGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5CE1E6" />
            <stop offset="100%" stopColor="#34A853" />
          </linearGradient>
          <linearGradient id="customerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FABB05" />
            <stop offset="100%" stopColor="#F29900" />
          </linearGradient>
          <linearGradient id="clerkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FCE8E6" />
            <stop offset="100%" stopColor="#F6C5BE" />
          </linearGradient>
          <linearGradient id="briefcaseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EA4335" />
            <stop offset="100%" stopColor="#C5221F" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Background glowing elements */}
        <circle cx="250" cy="150" r="130" fill="url(#bgGlow)" opacity="0.8" filter="url(#glow)" />
        <circle cx="100" cy="80" r="25" fill="#D2E3FC" opacity="0.7" className="animate-pulse" style={{ animationDuration: '3s' }} />
        <circle cx="420" cy="200" r="45" fill="#D2E3FC" opacity="0.4" className="animate-bounce" style={{ animationDuration: '4s' }} />
        
        {/* Decorative sparkles */}
        <g className="animate-pulse" style={{ animationDuration: '2s' }}>
          <path d="M 80 50 L 85 65 L 100 70 L 85 75 L 80 90 L 75 75 L 60 70 L 75 65 Z" fill="#4285F4" filter="url(#softShadow)" />
        </g>
        <g className="animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }}>
          <path d="M 420 60 L 423 70 L 433 73 L 423 76 L 420 86 L 417 76 L 407 73 L 417 70 Z" fill="#FABB05" filter="url(#softShadow)" />
        </g>

        {/* Desk / Counter */}
        <path d="M 40 200 L 460 200 L 480 280 L 20 280 Z" fill="url(#deskGrad)" opacity="0.95" filter="url(#softShadow)" />
        {/* Desk Glass Top Reflection */}
        <path d="M 40 200 L 460 200 L 465 220 L 35 220 Z" fill="#ffffff" opacity="0.2" />
        <rect x="40" y="200" width="420" height="3" fill="#ffffff" opacity="0.6" />
        
        {/* Plant on Desk */}
        <g filter="url(#softShadow)">
          <rect x="360" y="170" width="34" height="34" rx="6" fill="#FABB05" />
          <rect x="360" y="170" width="34" height="10" rx="3" fill="#F29900" />
          <path d="M 377 170 C 377 130, 340 120, 340 120 C 340 120, 355 145, 377 170" fill="url(#plantGrad)" />
          <path d="M 377 170 C 377 130, 414 120, 414 120 C 414 120, 399 145, 377 170" fill="url(#plantGrad)" />
          <path d="M 377 170 C 377 110, 377 110, 377 110" stroke="url(#plantGrad)" strokeWidth="4" strokeLinecap="round" />
        </g>
        
        {/* Large Decorative Element (Right) */}
        <path d="M 440 280 C 440 160, 520 100, 470 60 C 420 20, 370 120, 440 280" fill="url(#deskGrad)" opacity="0.8" filter="url(#softShadow)" />
        <path d="M 440 280 C 440 160, 440 60, 470 60" stroke="#ffffff" strokeWidth="2" strokeDasharray="5,5" fill="none" opacity="0.5" />

        {/* Person (Clerk/Receptionist) */}
        <g filter="url(#softShadow)">
          <circle cx="280" cy="110" r="28" fill="#3D3D3D" />
          <path d="M 250 180 C 250 135, 310 135, 310 180 L 310 200 L 250 200 Z" fill="url(#clerkGrad)" />
          <circle cx="280" cy="110" r="20" fill="#FAD1C4" />
          {/* Clerk glasses/details */}
          <rect x="268" y="105" width="24" height="8" rx="4" fill="#ffffff" opacity="0.5" />
        </g>

        {/* Person (Customer) */}
        <g filter="url(#softShadow)">
          <circle cx="150" cy="100" r="26" fill="#202124" />
          <path d="M 115 180 C 115 130, 185 130, 185 180 L 185 200 L 115 200 Z" fill="url(#customerGrad)" />
          <circle cx="150" cy="100" r="18" fill="#5F6368" />
        </g>
        
        {/* Arm and Document */}
        <g filter="url(#softShadow)">
          <path d="M 165 145 L 225 175 L 210 190 L 150 160 Z" fill="url(#customerGrad)" /> 
          {/* Glowing Document being handed over */}
          <rect x="215" y="165" width="45" height="35" fill="#ffffff" rx="4" filter="url(#glow)" /> 
          <rect x="215" y="165" width="45" height="35" fill="#ffffff" rx="4" /> 
          <rect x="225" y="175" width="25" height="4" fill="#4285F4" rx="2" />
          <rect x="225" y="185" width="15" height="4" fill="#4285F4" rx="2" opacity="0.5" />
        </g>

        {/* Customer Briefcase */}
        <g filter="url(#softShadow)">
          <rect x="80" y="210" width="60" height="45" fill="url(#briefcaseGrad)" rx="6" />
          <rect x="80" y="210" width="60" height="15" fill="#C5221F" rx="6" />
          <rect x="95" y="195" width="30" height="15" fill="none" stroke="url(#briefcaseGrad)" strokeWidth="4" rx="4" />
          <circle cx="110" cy="225" r="4" fill="#FABB05" />
          <circle cx="110" cy="225" r="2" fill="#ffffff" opacity="0.8" />
        </g>
        
        {/* Desk Base Shadows / Lines */}
        <line x1="20" y1="280" x2="480" y2="280" stroke="#1A73E8" strokeWidth="6" strokeLinecap="round" />
        <line x1="50" y1="290" x2="200" y2="290" stroke="#8AB4F8" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <line x1="240" y1="290" x2="430" y2="290" stroke="#8AB4F8" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      </svg>
    </div>
  );
}
