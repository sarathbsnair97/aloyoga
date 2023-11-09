import { defer, type LoaderArgs } from '@shopify/remix-oxygen';
import React from 'react';
import {
  Await,
  useLoaderData,
  Link,
  type V2_MetaFunction,
} from '@remix-run/react';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import type {
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';
import { Video } from '@shopify/hydrogen';
import { SwiperSlide, Swiper } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { Section } from '~/components/elements/Section';

export const meta: V2_MetaFunction = () => {
  return [{title: 'Hydrogen | Home'}];
};

export async function loader({context}: LoaderArgs) {
  const {storefront} = context;
  const {collections} = await storefront.query(FEATURED_COLLECTION_QUERY);
  const featuredCollection = collections.nodes[0];
  const recommendedProducts = storefront.query(RECOMMENDED_PRODUCTS_QUERY);
  const bannerImages = await storefront.query(HOMEPAGE_SEO_QUERY, {
    variables: {
      handle: 'banner-image',
    },
  });
  const imageDetails = bannerImages?.aloyoga?.banner_images?.references?.nodes;
  const videoDetails = bannerImages?.aloyoga?.banner_video?.reference;
  return defer({ featuredCollection, recommendedProducts, imageDetails, videoDetails });
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  const bannerOne = data?.imageDetails[0]?.image;
  const bannerTwo = data?.imageDetails[1]?.image;
  return (
    <>
      <div className="home">
        <Carousel url={data?.imageDetails} />
        <SpreadMedia url={data.videoDetails}/>
        <FeaturedCollection collection={data.featuredCollection} />
        <RecommendedProducts products={data.recommendedProducts} />
      </div>
    </>
  );
}
type SpreadMediaProps = {
  url: any;
};
const SpreadMedia: React.FC<SpreadMediaProps> = ({ url }) => {

  return (
    <Section>
    <Link to={`/collections/men`}>
      <Video
        data={url}
        width={"100%"}
        controls={false}
        muted
        loop
        playsInline
        autoPlay
      />
      </Link>
      </Section>
    );
  }

function FeaturedCollection({
  collection,
}: {
  collection: FeaturedCollectionFragment;
}) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <Link
      className="featured-collection"
      to={`/collections/${collection.handle}`}
    >
      {image && (
        <div className="featured-collection-image">
          <Image data={image} sizes="100vw" />
        </div>
      )}
    </Link>
  );
}

function RecommendedProducts({
  products,
}: {
  products: Promise<RecommendedProductsQuery>;
  }) {
  return (
    <Section>
    <div className="recommended-products">
      <h2 className='pb-1'>Recommended Products</h2>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {({products}) => (
            <div className="recommended-products-grid">
              {products.nodes.map((product) => (
                <Link
                  key={product.id}
                  className="recommended-product"
                  to={`/products/${product.handle}`}
                >
                  <Image
                    data={product.images.nodes[0]}
                    aspectRatio="1/1"
                    sizes="(min-width: 45em) 20vw, 50vw"
                  />
                  <h4>{product.title}</h4>
                  <small>
                    <Money data={product.priceRange.minVariantPrice} />
                  </small>
                </Link>
              ))}
            </div>
          )}
          </Await>
        </Suspense>
        <br />
      </div>
    </Section>
  );
}

type CarouselProps = {
  url: any;
};

const Carousel: React.FC<CarouselProps> = ({ url }) => {
  return (
    <div className="custom-section">
      <Section>
        <Swiper pagination={true} modules={[Pagination]} className="mySwiper">
          {
            url.map((item) => {
              return (
                <SwiperSlide>
                  <Image
                    data={item.image}
                    width={"100%"}
                  />
                </SwiperSlide>
              )
            })
          }
        </Swiper>
      </Section>
    </div>
  );
};

 const MEDIA_FRAGMENT = `#graphql
  fragment Media on Media {
    __typename
    mediaContentType
    alt
    previewImage {
      url
    }
    ... on MediaImage {
      id
      image {
        url
        width
        height
      }
    }
    ... on Video {
      id
      sources {
        mimeType
        url
      }
    }
    ... on Model3d {
      id
      sources {
        mimeType
        url
      }
    }
    ... on ExternalVideo {
      id
      embedUrl
      host
    }
  }
`;
 const VIDEO_FRAGMENT = `#graphql
  fragment Video on Video {
    alt
    id
    mediaContentType
    previewImage {
      url
    }
    sources {
      mimeType
      url
    }
  }
`;

const COLLECTION_CONTENT_FRAGMENT = `#graphql
${ MEDIA_FRAGMENT}
  fragment CollectionContent on Collection {
    id
    handle
    title
    descriptionHtml
     banner_video: metafield(namespace: "aloyoga", key: "banner_video") {
        reference {
            ...Media
          }
    }
     banner_images: metafield(namespace: "aloyoga", key: "banner_images") { 
         id
        namespace
        key
        value
        type 
     references (first: 10){
          nodes {
            ... on MediaImage {
              image {
              url
              }
            }
          }
        }
    }
  }
`;

const HOMEPAGE_SEO_QUERY = `#graphql
  ${COLLECTION_CONTENT_FRAGMENT}
  query collectionContent($handle: String, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    aloyoga: collection(handle: $handle) {
      ...CollectionContent
    }
  }
`;

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 1) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;

const BANNER_COLLECTION_QUERY = `#graphql
  fragment BannerCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query BannerCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 3, query: "title:'Banner'") {
      nodes {
        ...BannerCollection
      }
    }
  }
` as const;
