import { json, redirect, type LoaderArgs } from '@shopify/remix-oxygen';
import { useLoaderData, Link, type V2_MetaFunction, useSearchParams, NavLink } from '@remix-run/react';
import {
  Pagination,
  getPaginationVariables,
  Image,
  Money,
} from '@shopify/hydrogen';
import type { ProductItemFragment } from 'storefrontapi.generated';
import { useVariantUrl } from '~/utils';
import { useState, useEffect, useRef, Key } from 'react';
import ProductCard from './productCard';
import CollectionFilter from '~/components/elements/CollectionFilter';
export const meta: V2_MetaFunction = ({ data }) => {
  return [{ title: `Hydrogen | ${data.collection.title} Collection` }];
};

export async function loader({ request, params, context }: LoaderArgs) {
  const { handle } = params;
  const pageBy = 48;
  var sortKey = 'MANUAL';
  var sortReverse = false;
  const { storefront } = context;
  const url = new URL(request.url);
  sortKey = url.searchParams.get('sortkey');
  sortReverse = url.searchParams.get('reverse') === 'true' ? true : false;
  const paginationVariables = getPaginationVariables(request, {
    pageBy
  });
  var filterAvailability = url.searchParams.get('availability') === 'true' ? true : url.searchParams.get('availability') === 'false' ? false : 'both';
  if (!handle) {
    return redirect('/collections');
  }
  const { collection } = await storefront.query(COLLECTION_QUERY, {
    variables: {
      handle, ...paginationVariables, sortKey,
      sortReverse 
    },
  });

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }
  return json({collection});
}

export default function Collection() {
  const { collection } = useLoaderData<typeof loader>();
  const [productCount, setProductCount] = useState(0);
  return (
    <div className="collection">
      <div className="plp-header nativeapp-hide"><h1 className="h2" style={{ color: 'black' }}>{collection.title}</h1></div>
      <div style={{ textAlign: "center", paddingBottom: "2px" }}><div className="small-p loading-status-message">{productCount}  products</div></div>
      <p className="colletion-description">{collection.description}</p>
      <CollectionFilter />
      <Pagination connection={collection.products}>
        {({ nodes, NextLink, PreviousLink, isLoading }) => (
          <>
            <div className="flex items-center justify-center mt-6" style={{ textAlign: "center" }}>
              <PreviousLink style={{ textAlign: "center" }} className="inline-block rounded font-medium text-center py-3 px-6 border w-full cursor-pointer">
                <h2> {isLoading ? 'Loading...' : 'Load previous products'}</h2>
              </PreviousLink>
            </div>
            <div className="grid-flow-row grid gap-2 gap-y-6 md:gap-4 lg:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <ProductsGrid
                products={nodes}
                setProductCount={setProductCount}
              />
            </div>
            <div className="flex items-center justify-center mt-6" style={{ textAlign: "center" }}>
              <NextLink className="inline-block rounded font-medium text-center py-3 px-6 border w-full cursor-pointer">
                <h2> {isLoading ? 'Loading...' : 'Load more products'}</h2>
              </NextLink>
            </div>
          </>
        )}
      </Pagination>
    </div>
  );
}
interface ProductsGridtProps {
  setProductCount: (productCount: number) => void;
  products: ProductItemFragment[];
}
function ProductsGrid({ products, setProductCount }: ProductsGridtProps) {
  setProductCount(products.length);
  return (
    <div className="products-grid">
      {products.map((product: ProductItemFragment, index: number) => {
        return (
          <ProductItem
            key={product.id}
            product={product}
            loading={index < 4 ? 'eager' : undefined}
          />
        );
      })}
    </div>
  );
}

interface ProductVariantProps {
  product: ProductItemFragment;
  setImage: (url: object) => void;
  setColor: (color: string) => void;
  color: string;
  sizeValue: string;
  setSize: (size: string) => void;
}

function ProductVariant({
  product,
  setImage,
  setColor,
  color,
  setSize,
  sizeValue,
}: ProductVariantProps) {

  const handleVariantImage = (url: Maybe<Pick<Image, "url" | "altText" | "width" | "height">> | undefined, color: string, size: string) => {
    if (url) {
      setImage(url as object);
      setColor(color);
      setSize(size);
    }
  };

  return (
    <div className='buttoncontainer'>
      <div className='button-row'>
        {product.map((variant: { selectedOptions: any[]; image: any; }, index: Key | null | undefined) => {
          const colorOption = variant.selectedOptions.find((option: { name: string; }) => option.name === 'Color')?.value;
          const sizeOption = variant.selectedOptions.find((option: { name: string; }) => option.name === 'Size')?.value;
          const imageURL = variant.image;
          if (colorOption !== undefined && sizeOption !== undefined) {
            return (
              <div key={index} className='buttoncontainer'>
                <div className='swatches-wrapper'>
                  <div className='swatches'>
                    <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
                      <button
                        type='button'
                        className='SwatchUI'
                        style={{
                          backgroundColor: colorOption,
                          border: '2px solid white',
                          outline: `2px solid ${colorOption === color && sizeOption === sizeValue ? 'black' : 'white'
                            }`,
                        }}
                        onClick={() => handleVariantImage(imageURL, colorOption, sizeOption)}
                      ></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

function ProductItem({
  product,
  loading,
}: {
  product: ProductItemFragment;
  loading?: 'eager' | 'lazy';
  }) {

  
  const [image, setImage] = useState(product.featuredImage);
  const variant = product.variants.nodes[0];
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions);
  const selectedOptions = product.variants.nodes[0].selectedOptions;
  const sizeObject = selectedOptions.find((option) => option.name === 'Size');
  const colorObject = selectedOptions.find((option) => option.name === 'Color');
  const sizeVariable: { [key: string]: string } = sizeObject ? { [sizeObject.name]: sizeObject.value } : {};
  const colorVariable: { [key: string]: string } = colorObject ? { [colorObject.name]: colorObject.value } : {};
  const [color, setColor] = useState(colorVariable.Color);
  const [sizeValue, setSize] = useState(sizeVariable.Size);
  var variantsCount = product.variants.nodes.length;
  const uniqueColors = Array.from(new Set(product.variants.nodes.map(item => item.selectedOptions.find(option => option.name === 'Color')?.value)));

  const uniqueProducts = uniqueColors.map(color =>
    product.variants.nodes.find(item => item.selectedOptions.find(option => option.name === 'Color')?.value === color)
  );

  return (
    <>
      <div
        className="product-item"
        key={product.id}
        prefetch="intent"
        to={variantUrl}
      >
        {product.featuredImage && (
          <Link
            className="product-item"
            key={product.id}
            prefetch="intent"
            to={variantUrl}
          >
            <ProductCard
              imgUrl={image ? image : ""}
            />
          </Link>
        )}
        <div style={{ display: 'flex' }}>
          <ProductVariant
            product={uniqueProducts}
            setImage={setImage}
            setColor={setColor}
            setSize={setSize}
            sizeValue={sizeValue}
            color={color}
          />
          {
            variantsCount >= 8 ? <Link
              className="product-item"
              key={product.id}
              prefetch="intent"
              to={variantUrl}
            ><h4 style={{ marginTop: '0.8rem' }}>+{variantsCount}</h4></Link> : ""
          }
        </div>
        <Link
          className="product-item"
          key={product.id}
          prefetch="intent"
          to={variantUrl}
        >
          <h4>{product.title}</h4>
        </Link>
        <h5 className='pt-0 m-0'>{color ? color : ""}</h5>
        <h2><Money data={product.priceRange.minVariantPrice} /></h2>
      </div>
    </>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    variants(first: 10) {   
      nodes {
        selectedOptions {
          name
          value
        }
        image {
          url
          altText
          width
          height
        }
      }
    }
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey:  ProductCollectionSortKeys
    $sortReverse: Boolean
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        sortKey: $sortKey,
        reverse: $sortReverse
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;
function setImage(url: string) {
  throw new Error('Function not implemented.');
}

