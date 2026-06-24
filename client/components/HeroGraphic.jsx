import Image from 'next/image';

export default function HeroGraphic() {
  return (
    <div className="w-full flex justify-center py-2 mb-2">
      <div className="relative w-full max-w-[650px] aspect-[21/9] sm:aspect-video drop-shadow-2xl rounded-[24px] overflow-hidden border border-slate-200">
        <Image 
          src="/login-graphic.png" 
          alt="VoiceKhata Merchant Login" 
          fill
          priority
          className="object-cover object-top"
        />
      </div>
    </div>
  );
}
