import Image from 'next/image';

export default function HeroGraphic() {
  return (
    <div className="relative w-full h-[32vh] min-h-[260px] sm:h-[35vh]">
      <Image 
        src="/login-graphic.png" 
        alt="VoiceKhata Merchant Login" 
        fill
        priority
        className="object-cover object-top"
      />
    </div>
  );
}
