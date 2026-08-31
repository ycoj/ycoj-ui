/* eslint-disable @next/next/no-img-element */
'use client';

import { BannerConfig } from '@/api/server/method/ui/homepage';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

type Props = {
  banner: BannerConfig;
};

export default function Banner({ banner }: Props) {
  const t = useTranslations('homepage');
  if (!banner.pictures || banner.pictures.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 w-full">
      <Swiper
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        navigation={true}
        modules={[Autoplay]}
        className="overflow-hidden rounded-xl"
      >
        {banner.pictures.map((pic, index) => (
          <SwiperSlide key={index}>
            <Link
              href={pic.link}
              prefetch={false}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full w-full"
            >
              <div className="relative w-full">
                <img
                  src={pic.src}
                  alt={t('bannerAlt', { number: index + 1 })}
                  className="block h-auto w-full"
                />
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
