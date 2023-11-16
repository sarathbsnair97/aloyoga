import { Suspense } from 'react';
import { defer, redirect, type LoaderArgs } from '@shopify/remix-oxygen';
import {
  Await,
  Link,
  useLoaderData,
  type V2_MetaFunction,
  type FetcherWithComponents,
} from '@remix-run/react';
import type {
  ProductFragment,
  ProductVariantsQuery,
  ProductVariantFragment,
} from 'storefrontapi.generated';
import wishlist from '../../public/wishlist.svg'
import {
  Image,
  Money,
  VariantSelector,
  type VariantOption,
  getSelectedProductOptions,
  CartForm,
} from '@shopify/hydrogen';
import type {
  CartLineInput,
  SelectedOption,
} from '@shopify/hydrogen/storefront-api-types';
import { getVariantUrl } from '~/utils';
import { Button } from 'reactstrap';
import { Section } from '~/components/elements/Section';

export const meta: V2_MetaFunction = ({ data }) => {
  return [{ title: `Hydrogen | ${data.product.title}` }];
};

export async function loader({ params, request, context }: LoaderArgs) {
  const { handle } = params;
  const { storefront } = context;

  const selectedOptions = getSelectedProductOptions(request).filter(
    (option) =>
      // Filter out Shopify predictive search query params
      !option.name.startsWith('_sid') &&
      !option.name.startsWith('_pos') &&
      !option.name.startsWith('_psq') &&
      !option.name.startsWith('_ss') &&
      !option.name.startsWith('_v') &&
      // Filter out third party tracking params
      !option.name.startsWith('fbclid'),
  );

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  // await the query for the critical product data
  const { product } = await storefront.query(PRODUCT_QUERY, {
    variables: { handle, selectedOptions },
  });

  if (!product?.id) {
    throw new Response(null, { status: 404 });
  }

  const firstVariant = product.variants.nodes[0];
  const firstVariantIsDefault = Boolean(
    firstVariant.selectedOptions.find(
      (option: SelectedOption) =>
        option.name === 'Title' && option.value === 'Default Title',
    ),
  );

  if (firstVariantIsDefault) {
    product.selectedVariant = firstVariant;
  } else {
    // if no selected variant was returned from the selected options,
    // we redirect to the first variant's url with it's selected options applied
    if (!product.selectedVariant) {
      return redirectToFirstVariant({ product, request });
    }
  }

  // In order to show which variants are available in the UI, we need to query
  // all of them. But there might be a *lot*, so instead separate the variants
  // into it's own separate query that is deferred. So there's a brief moment
  // where variant options might show as available when they're not, but after
  // this deffered query resolves, the UI will update.
  const variants = storefront.query(VARIANTS_QUERY, {
    variables: { handle },
  });

  return defer({ product, variants });
}

function redirectToFirstVariant({
  product,
  request,
}: {
  product: ProductFragment;
  request: Request;
}) {
  const url = new URL(request.url);
  const firstVariant = product.variants.nodes[0];

  throw redirect(
    getVariantUrl({
      pathname: url.pathname,
      handle: product.handle,
      selectedOptions: firstVariant.selectedOptions,
      searchParams: new URLSearchParams(url.search),
    }),
    {
      status: 302,
    },
  );
}

export default function Product() {
  const { product, variants } = useLoaderData<typeof loader>();
  const { selectedVariant } = product;
  return (
    <div className="product">
      {/* <div className="image-div">
        {product?.media?.edges?.map((item) => {
          return <ProductImage image={item} />
        })}
      </div> */}
      <div className='image-description-styles'>
        <ProductImage image={selectedVariant?.image} />
        <ProductMain
          selectedVariant={selectedVariant}
          product={product}
          variants={variants}
        />
      </div>
      <br />
      <hr style={{ borderColor: '#ccc' }} />
      <DescriptionMain
        description={product.descriptionHtml}
        fit={product.fit}
        fabrication={product.fabrication}
      />
      <hr style={{ borderColor: '#ccc' }} />
    </div>
  );
}

function DescriptionMain({ description, fit, fabrication }) {
  return (
    <Section>
      <div className='description-box'>
        <div className='product-description' dangerouslySetInnerHTML={{ __html: description }}>
          {/* <h1>{description}</h1> */}
        </div>
        <div className='description-fit'>
          <h1>FIT</h1>
          <div className='fit-description-styles' dangerouslySetInnerHTML={{ __html: fit.value }}>
          </div>
        </div>
        <div className='description-fabrication'>
          <h1>FABRICATION</h1>
          <div className='fabrication-description-styles' dangerouslySetInnerHTML={{ __html: fabrication.value }}>
          </div>
        </div>
      </div>
    </Section>
  );
}

function ProductImage({ image }: { image: ProductVariantFragment['image'] }) {
  // function ProductImage({ image }) {
  if (!image) {
    return <div className="product-image" />;
  }
  return (
    <div className="product-image" >
      <Image
        alt={image.altText || 'Product Image'}
        data={image}
        key={image.id}
        // data={image.node}
        // src={image.node.previewImage.transformedSrc}
        sizes="(min-width: 45em) 50vw, 100vw"
      />
    </div>
  );
}

function ProductMain({
  selectedVariant,
  product,
  variants,
}: {
  product: ProductFragment;
  selectedVariant: ProductFragment['selectedVariant'];
  variants: Promise<ProductVariantsQuery>;
}) {
  const { title, descriptionHtml, } = product;
  return (
    <div className="product-main">
      <h1 className='title-style'>{title}</h1>
      <ProductPrice selectedVariant={selectedVariant} />
      <br />
      <span className="exclution-description">(Excluding taxes and duties)</span>
      <hr style={{
        backgroundColor: "#cfcfcf", height: "0.1rem",
        border: 0,
        margin: "15px 0"
      }} />
      <Suspense
        fallback={
          <ProductForm
            product={product}
            selectedVariant={selectedVariant}
            variants={[]}
          />
        }
      >
        <Await
          errorElement="There was a problem loading product variants"
          resolve={variants}
        >
          {(data) => (
            <ProductForm
              product={product}
              selectedVariant={selectedVariant}
              variants={data.product?.variants.nodes || []}
            />
          )}
        </Await>
      </Suspense>
      <br />
      <div className="free-shipping-description">
        <img src="https://cdn.shopify.com/s/files/1/2185/2813/files/truck_cart.png?v=1663703912" width="22" alt="" />
        <span style={{ marginLeft: "10px" }}>Free Shipping and Easy Returns.</span>
      </div>
    </div>
  );
}

function ProductPrice({
  selectedVariant,
}: {
  selectedVariant: ProductFragment['selectedVariant'];
}) {
  return (
    <div style={{ color: "black", fontSize: "larger" }} className="product-price">
      {selectedVariant?.compareAtPrice ? (
        <>
          <p>Sale</p>
          <br />
          <div className="product-price-on-sale">
            {selectedVariant ? <Money data={selectedVariant.price} /> : null}
            <s>
              <Money data={selectedVariant.compareAtPrice} />
            </s>
          </div>
        </>
      ) : (
        selectedVariant?.price && <Money data={selectedVariant?.price} />
      )}
    </div>
  );
}

function ProductForm({
  product,
  selectedVariant,
  variants,
}: {
  product: ProductFragment;
  selectedVariant: ProductFragment['selectedVariant'];
  variants: Array<ProductVariantFragment>;
}) {
  return (
    <div className="product-form">
      <VariantSelector
        handle={product.handle}
        options={product.options}
        variants={variants}
      >
        {({ option }) => <ProductOptions key={option.name} option={option} />}
      </VariantSelector>
      <br />
      {/* {
        Array.isArray(product?.options?.map(item => item.name === "Size")) ?
          <SizeSelector sizeData={product?.options?.filter(item => item.name === "Size")} />
          : <div><h1>Hello World</h1></div>} */}
      <VariantSelector
        handle={product.handle}
        options={product.options}
        variants={variants}
      >
        {({ option }) => <SizeSelector key={option.name} option={option} />}
      </VariantSelector>
      <br />
      <AddToCartButton
        disabled={!selectedVariant || !selectedVariant.availableForSale}
        onClick={() => {
          window.location.href = window.location.href + '#cart-aside';
        }}
        lines={
          selectedVariant
            ? [
              {
                merchandiseId: selectedVariant.id,
                quantity: 1,
              },
            ]
            : []
        }
      >
        {selectedVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
      </AddToCartButton>
      <AddToWishlistButton />
    </div>
  );
}

function SizeSelector({ option }) {
  return (
    //   <div className='size-elements'>
    //     {sizeData[0]?.values?.map((item) => {
    //       return (
    //         <button className='size-button'><span>{item}</span></button>
    //       );
    //     })}
    //   </div>
    <div>
      {option.name === "Size" ?
        <div className='size-elements'>
          {option.values.map(({ value, isAvailable, isActive, to }) => {
            return <Link style={{ textDecoration: "none", backgroundColor: isActive ? 'black' : '' }} to={to}><button style={{ color: isActive ? 'white' : '' }} className='size-button'>{value}</button></Link>
          })}
        </div>
        : null}
    </div>
  );
}

function ProductOptions({ option }: { option: VariantOption }) {
  return (
    <div>
      {option.name === "Color" ?
        <div className="product-options" key={option.name}>
          {/* <h5>{option.name}</h5> */}
          <div className="product-options-grid">
            {option.values.map(({ value, isAvailable, isActive, to }) => {
              return (
                <Link
                  className="product-options-item"
                  key={option.name + value}
                  prefetch="intent"
                  preventScrollReset
                  replace
                  to={to}
                  style={{
                    border: '1px solid black',
                    opacity: isAvailable ? 1 : 0.3,
                    backgroundColor: value,
                    width: '20px',
                    borderRadius: '50%',
                    height: '28px',
                    outline: isActive ? 'black solid 2px' : '',
                    outlineOffset: isActive ? '5px' : ''
                  }}
                >
                  {/* {value} */}
                </Link>
              );
            })}
          </div>
          <br />
        </div> : null}
    </div>
  );
}

function AddToWishlistButton() {
  return (
    <div>
      <button className='wishlist-button'><img className="wishlist-style" src={wishlist} alt="Wishlist Icon" />Add To Wishlist</button>
    </div>
  );
}

function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
}: {
  analytics?: unknown;
  children: React.ReactNode;
  disabled?: boolean;
  lines: CartLineInput[];
  onClick?: () => void;
}) {
  return (
    <CartForm route="/cart" inputs={{ lines }} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher: FetcherWithComponents<any>) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <button
            type="submit"
            onClick={onClick}
            disabled={disabled ?? fetcher.state !== 'idle'}
            className="add-to-bag-styles"
          >
            {children}
          </button>
        </>
      )}
    </CartForm>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
          fragment ProductVariant on ProductVariant {
            availableForSale
    compareAtPrice {
            amount
      currencyCode
    }
          id
          image {
            __typename
      id
          url
          altText
          width
          height
    }
          price {
            amount
      currencyCode
    }
          product {
            title
      handle
    }
          selectedOptions {
            name
      value
    }
          sku
          title
          unitPrice {
            amount
      currencyCode
    }
  }
          ` as const;

const PRODUCT_FRAGMENT = `#graphql
          fragment Product on Product {
            id
            fit: metafield(namespace: "custom", key: "fit") {
              value
            }
            fabrication: metafield(namespace: "custom", key: "fabrication") {
              value 
            }
          title
          vendor
          handle
          descriptionHtml
          description 
          media(first: 5) {
            edges {
            cursor
        node {
            alt
          mediaContentType
          previewImage {
            altText
            originalSrc
          transformedSrc(maxWidth: 500, maxHeight: 400, crop: CENTER, preferredContentType: JPG)
          }
        }
      }
    }
          options {
            name
      values
    }
          selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
            ...ProductVariant
          }
          variants(first: 1) {
            nodes {
            ...ProductVariant
          }
    }
          seo {
            description
      title
    }
  }
          ${PRODUCT_VARIANT_FRAGMENT}
          ` as const;

const PRODUCT_QUERY = `#graphql
          query Product(
          $country: CountryCode
          $handle: String!
          $language: LanguageCode
          $selectedOptions: [SelectedOptionInput!]!
          ) @inContext(country: $country, language: $language) {
            product(handle: $handle) {
            ...Product
          }
  }
          ${PRODUCT_FRAGMENT}
          ` as const;

const PRODUCT_VARIANTS_FRAGMENT = `#graphql
          fragment ProductVariants on Product {
            variants(first: 250) {
            nodes {
            ...ProductVariant
          }
    }
  }
          ${PRODUCT_VARIANT_FRAGMENT}
          ` as const;

const VARIANTS_QUERY = `#graphql
          ${PRODUCT_VARIANTS_FRAGMENT}
          query ProductVariants(
          $country: CountryCode
          $language: LanguageCode
          $handle: String!
          ) @inContext(country: $country, language: $language) {
            product(handle: $handle) {
            ...ProductVariants
          }
  }
          ` as const;
