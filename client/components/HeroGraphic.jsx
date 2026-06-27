import Image from 'next/image';

export default function HeroGraphic() {
  return (
    <div className="relative w-full h-[22vh] min-h-[180px] sm:h-[25vh]">
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
