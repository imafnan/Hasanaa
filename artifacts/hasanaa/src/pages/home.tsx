import {
  useListBanners, getListBannersQueryKey,
  useListCategories, getListCategoriesQueryKey,
  useListProducts, getListProductsQueryKey,
  useListPromotions, getListPromotionsQueryKey,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { ProductCard } from "@/components/product-card";
import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function PromotionGrid({ promo }: { promo: any }) {
  const items: any[] = (promo.items || []).filter((i: any) => i.imageUrl);
  if (!items.length) return null;

  const getLink = (item: any): string => {
    if (item.subcategoryId) return `/subcategory/${item.subcategoryId}`;
    if (item.categoryId) return `/category/${item.categoryId}`;
    return "#";
  };

  const cols = promo.gridType === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4";

  return (
    <section className="container mx-auto px-4">
      {promo.title && (
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-primary mb-2">{promo.title}</h2>
          <div className="h-1 w-20 bg-secondary mx-auto rounded-full" />
        </div>
      )}
      <div className={`grid ${cols} gap-4`}>
        {items.map((item: any, i: number) => (
          <Link key={i} href={getLink(item)}>
            <div className="group relative aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer">
              <img src={item.imageUrl} alt={item.label || ""} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              {item.label && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                  <span className="text-white font-serif font-semibold text-lg">{item.label}</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function MidBanner({ banner }: { banner: any }) {
  const href = banner.categoryId ? `/category/${banner.categoryId}` : banner.linkUrl || null;
  const content = (
    <div className="relative w-full h-[220px] md:h-[320px] overflow-hidden rounded-xl">
      <img src={banner.imageUrl} alt={banner.title} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16">
        <h2 className="text-2xl md:text-4xl font-serif font-bold text-white mb-2">{banner.title}</h2>
        {banner.subtitle && <p className="text-white/80 text-base md:text-lg mb-4">{banner.subtitle}</p>}
        {href && (
          <span className="inline-block bg-white text-foreground font-medium text-sm px-5 py-2 rounded-full w-fit">Shop Now</span>
        )}
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

export default function Home() {
  const { data: banners, isLoading: loadingBanners } = useListBanners({ query: { queryKey: getListBannersQueryKey() } });
  const { data: categories, isLoading: loadingCategories } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });
  const { data: featuredProducts, isLoading: loadingProducts } = useListProducts({ featured: "true" }, { query: { queryKey: getListProductsQueryKey({ featured: "true" }) } });
  const { data: promotions } = useListPromotions({ query: { queryKey: getListPromotionsQueryKey() } });

  const heroBanners = (banners || []).filter(b => b.isActive && ((b as any).position === "hero" || !(b as any).position)).sort((a, b) => a.sortOrder - b.sortOrder);
  const midBanners = (banners || []).filter(b => b.isActive && (b as any).position === "mid").sort((a, b) => a.sortOrder - b.sortOrder);
  const activeCategories = (categories || []).filter(c => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const activePromotions = (promotions || []).filter((p: any) => p.isActive).sort((a: any, b: any) => a.sortOrder - b.sortOrder);
  const topPromotions = activePromotions.filter((p: any) => p.position === "top");
  const bottomPromotions = activePromotions.filter((p: any) => p.position === "bottom");

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Banner Carousel */}
      <section className="relative w-full">
        {loadingBanners ? (
          <div className="w-full h-[70vw] md:h-screen bg-muted animate-pulse flex items-center justify-center">
            <span className="text-muted-foreground">Loading...</span>
          </div>
        ) : heroBanners.length > 0 ? (
          <div className="relative group">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {heroBanners.map((banner) => (
                  <div key={banner.id} className="relative flex-[0_0_100%] min-w-0">
                    <div className="w-full h-[70vw] md:h-screen relative">
                      <img src={banner.imageUrl} alt={banner.title} className="absolute inset-0 w-full h-full object-contain md:object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                      <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10">
                        <div className="max-w-xl text-white">
                          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 leading-tight">{banner.title}</h1>
                          {banner.subtitle && <p className="text-lg md:text-xl mb-8 text-white/90">{banner.subtitle}</p>}
                          {banner.linkUrl && (
                            <Button asChild size="lg" className="text-lg font-serif">
                              <Link href={banner.linkUrl}>Shop Now</Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {heroBanners.length > 1 && (
              <>
                <Button variant="outline" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-background/80 hover:bg-background" onClick={scrollPrev}>
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button variant="outline" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-background/80 hover:bg-background" onClick={scrollNext}>
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="w-full h-[70vw] md:h-screen relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
            <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10">
              <div className="max-w-xl">
                <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 leading-tight text-foreground">Elegance in Tradition</h1>
                <p className="text-lg md:text-xl mb-8 text-muted-foreground">Discover premium Islamic menswear crafted with distinction and care.</p>
                <Button asChild size="lg" className="text-lg font-serif"><Link href="/">Shop Now</Link></Button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Top Promotions */}
      {topPromotions.map((promo: any) => <PromotionGrid key={promo.id} promo={promo} />)}

      {/* Categories */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif font-bold text-primary mb-2">Shop by Category</h2>
          <div className="h-1 w-20 bg-secondary mx-auto rounded-full" />
        </div>
        {loadingCategories ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[1, 2, 3, 4].map(i => <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {activeCategories.map((category) => (
              <Link key={category.id} href={`/category/${category.id}`}>
                <div className="group cursor-pointer">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-3 relative">
                    {category.imageUrl ? (
                      <img src={category.imageUrl} alt={category.name} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/10">{category.name}</div>
                    )}
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  </div>
                  <h3 className="text-center font-serif font-medium text-lg text-foreground group-hover:text-primary transition-colors">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Mid-page Banners */}
      {midBanners.length > 0 && (
        <section className="container mx-auto px-4 flex flex-col gap-6">
          {midBanners.map((banner) => (
            <MidBanner key={banner.id} banner={banner} />
          ))}
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-serif font-bold text-primary mb-2">Featured Collection</h2>
              <div className="h-1 w-20 bg-secondary rounded-full" />
            </div>
          </div>
          {loadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
        </section>
      )}

      {/* Bottom Promotions */}
      {bottomPromotions.map((promo: any) => <PromotionGrid key={promo.id} promo={promo} />)}
    </div>
  );
}
