import { useListBanners, getListBannersQueryKey, useListCategories, getListCategoriesQueryKey, useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ProductCard } from "@/components/product-card";
import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: banners, isLoading: loadingBanners } = useListBanners({
    query: { queryKey: getListBannersQueryKey() }
  });

  const { data: categories, isLoading: loadingCategories } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() }
  });

  const { data: featuredProducts, isLoading: loadingProducts } = useListProducts(
    { featured: "true" },
    { query: { queryKey: getListProductsQueryKey({ featured: "true" }) } }
  );

  const activeBanners = banners?.filter(b => b.isActive).sort((a, b) => a.sortOrder - b.sortOrder) || [];
  const activeCategories = categories?.filter(c => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder) || [];

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Banner */}
      <section className="relative w-full">
        {loadingBanners ? (
          <div className="w-full h-[40vh] md:h-[70vh] bg-muted animate-pulse flex items-center justify-center">
            <span className="text-muted-foreground">Loading...</span>
          </div>
        ) : activeBanners.length > 0 ? (
          <div className="relative group">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {activeBanners.map((banner) => (
                  <div key={banner.id} className="relative flex-[0_0_100%] min-w-0">
                    <div className="w-full h-[50vh] md:h-[80vh] relative bg-black/20">
                      <img 
                        src={banner.imageUrl} 
                        alt={banner.title} 
                        className="absolute inset-0 w-full h-full object-cover -z-10"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent -z-10" />
                      <div className="container mx-auto px-4 h-full flex flex-col justify-center">
                        <div className="max-w-xl text-white">
                          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 leading-tight">
                            {banner.title}
                          </h1>
                          {banner.subtitle && (
                            <p className="text-lg md:text-xl mb-8 text-white/90">
                              {banner.subtitle}
                            </p>
                          )}
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
            {activeBanners.length > 1 && (
              <>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-background/80 hover:bg-background border-border"
                  onClick={scrollPrev}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-background/80 hover:bg-background border-border"
                  onClick={scrollNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="w-full h-[50vh] md:h-[80vh] relative bg-black/20">
            <img 
              src="/hero-banner.png" 
              alt="Hasanaa Menswear" 
              className="absolute inset-0 w-full h-full object-cover -z-10"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent -z-10" />
            <div className="container mx-auto px-4 h-full flex flex-col justify-center">
              <div className="max-w-xl text-white">
                <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 leading-tight">
                  Elegance in Tradition
                </h1>
                <p className="text-lg md:text-xl mb-8 text-white/90">
                  Discover premium Islamic menswear crafted with distinction and care.
                </p>
                <Button asChild size="lg" className="text-lg font-serif">
                  <Link href="/category/1">Shop Now</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif font-bold text-primary mb-2">Shop by Category</h2>
          <div className="h-1 w-20 bg-secondary mx-auto rounded-full" />
        </div>
        
        {loadingCategories ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {activeCategories.map((category) => (
              <Link key={category.id} href={`/category/${category.id}`}>
                <div className="group cursor-pointer">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-3 relative">
                    {category.imageUrl ? (
                      <img 
                        src={category.imageUrl} 
                        alt={category.name} 
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/10">
                        {category.name}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  </div>
                  <h3 className="text-center font-serif font-medium text-lg text-foreground group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-serif font-bold text-primary mb-2">Featured Collection</h2>
            <div className="h-1 w-20 bg-secondary rounded-full" />
          </div>
          <Button variant="outline" asChild>
            <Link href="/category/all">View All</Link>
          </Button>
        </div>
        
        {loadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : featuredProducts && featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No featured products at the moment.
          </div>
        )}
      </section>
    </div>
  );
}
