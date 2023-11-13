import { CartForm, Image, Money } from '@shopify/hydrogen';
import type { CartLineUpdateInput } from '@shopify/hydrogen/storefront-api-types';
import { Link } from '@remix-run/react';
import type { CartApiQueryFragment } from 'storefrontapi.generated';
import { useVariantUrl } from '~/utils';
import expandArrow from '../../public/icons8-expand-arrow-50.png'
import contractArrow from '../../public/icons8-expand-arrow-50.png'
import { useState } from 'react';

type CartLine = CartApiQueryFragment['lines']['nodes'][0];

type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: 'page' | 'aside';
};

export function CartMain({ layout, cart }: CartMainProps) {
  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const withDiscount =
    cart &&
    Boolean(cart.discountCodes.filter((code) => code.applicable).length);
  const className = `cart-main ${withDiscount ? 'with-discount' : ''}`;
  return (
    <div className={className}>
      {linesCount ? <CartDetails cart={cart} layout={layout} /> : <CartEmpty hidden={linesCount} layout={layout} />}
    </div>
  );
}

function CartDetails({ layout, cart }: CartMainProps) {
  const cartHasItems = !!cart && cart.totalQuantity > 0;
  return (
    <>
      <div className="cart-details">
        <CartLines lines={cart?.lines} layout={layout} />
        {cartHasItems && (
          <CartSummary cost={cart.cost} layout={layout}>
            {/* <CartDiscounts discountCodes={cart.discountCodes} /> */}
            <CartCheckoutActions checkoutUrl={cart.checkoutUrl} />
          </CartSummary>
        )}
      </div>
      {/* <CartDropDown />
      <ReturnBlock /> */}
    </>
  );
}

function CartLines({
  lines,
  layout,
}: {
  layout: CartMainProps['layout'];
  lines: CartApiQueryFragment['lines'] | undefined;
}) {
  if (!lines) return null;

  return (
    <div aria-labelledby="cart-lines">
      <ul>
        {lines.nodes.map((line) => (
          <CartLineItem key={line.id} line={line} layout={layout} />
        ))}
      </ul>
    </div>
  );
}

function CartLineItem({
  layout,
  line,
}: {
  layout: CartMainProps['layout'];
  line: CartLine;
}) {
  const { id, merchandise } = line;
  const { product, title, image, selectedOptions } = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);

  return (
    <div key={id} className="cart-line">
      {image && (
        <Image
          alt={title}
          aspectRatio="1/1"
          data={image}
          height={100}
          loading="lazy"
          width={100}
        />
      )}
      <div>
        <Link
          prefetch="intent"
          to={lineItemUrl}
          onClick={() => {
            if (layout === 'aside') {
              // close the drawer
              window.location.href = lineItemUrl;
            }
          }}
        >
          <h5 className='product-name-styles'>
            {product.title}
          </h5>
        </Link>
        <CartLinePrice line={line} as="span" />
        <ul className='list-styles'>
          {selectedOptions.map((option) => (
            <li key={option.name}>
              <span className='cart-details'>
                {option.name}: {option.value}
              </span>
            </li>
          ))}
        </ul>
        <CartLineQuantity line={line} />
      </div>
    </div>
  );
}

function CartCheckoutActions({ checkoutUrl }: { checkoutUrl: string }) {
  if (!checkoutUrl) return null;

  return (
    <div>
      <a href={checkoutUrl} target="_self">
        <button className='checkout-button-styles'>Checkout</button>
      </a>
      <br />
    </div>
  );
}

export function CartSummary({
  cost,
  layout,
  children = null,
}: {
  children?: React.ReactNode;
  cost: CartApiQueryFragment['cost'];
  layout: CartMainProps['layout'];
}) {
  const className =
    layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';

  return (
    <div aria-labelledby="cart-summary" className={className}>
      <h4 className='order-summary-styles'>Order Summary</h4>
      <dl className="cart-subtotal">
        <dt style={{ fontSize: '15px' }}>Subtotal:</dt>
        <dd style={{ fontWeight: '600' }}>
          {cost?.subtotalAmount?.amount ? (
            <Money data={cost?.subtotalAmount} />
          ) : (
            '-'
          )}
        </dd>
      </dl>
      {children}
    </div>
  );
}

function CartLineRemoveButton({ lineIds }: { lineIds: string[] }) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{ lineIds }}
    >
      <button className="remove-button-styles" type="submit"><svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="X"><path id="icon" fill-rule="evenodd" clip-rule="evenodd" d="M9.29293 10L4.64648 5.35359L5.35359 4.64648L10 9.29293L14.6465 4.64648L15.3536 5.35359L10.7071 10L15.3536 14.6465L14.6465 15.3536L10 10.7071L5.35359 15.3536L4.64648 14.6465L9.29293 10Z" fill="currentColor"></path></g></svg></button>
    </CartForm>
  );
}

function CartLineQuantity({ line }: { line: CartLine }) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const { id: lineId, quantity } = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));
  return (
    <div className="cart-line-quantiy">
      <div className='quantity-reader'>
        <CartLineUpdateButton lines={[{ id: lineId, quantity: prevQuantity }]}>
          <button
            className='quantity-button-style'
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            name="decrease-quantity"
            value={prevQuantity}
          >
            <svg className="icon__minus--new icon__increment" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="9" height="3"><defs><path id="a" d="M156.5 474v9"></path></defs><use fill="#fff" fill-opacity="0" stroke="#ccc" stroke-miterlimit="50" stroke-width="1.5" href="#a" transform="rotate(90 319 164)"></use></svg>
          </button>
        </CartLineUpdateButton>
        &nbsp;
        <small style={{ paddingTop: '0.1rem' }}>{quantity} </small>
        <CartLineUpdateButton lines={[{ id: lineId, quantity: nextQuantity }]}>
          <button
            className='quantity-button-style'
            aria-label="Increase quantity"
            name="increase-quantity"
            value={nextQuantity}
          >
            <svg className="icon__plus--new icon__increment" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="9" height="9" viewBox="0 0 9 9"><defs><path id="xnwwa" d="M203.5 474v9"></path></defs><g><g transform="translate(-199 -474)"><g><use fill="#fff" fill-opacity="0" stroke="#ccc" stroke-miterlimit="50" stroke-width="1.5" href="#xnwwa"></use></g><g transform="rotate(-270 203.5 478.5)"><use fill="#fff" fill-opacity="0" stroke="#ccc" stroke-miterlimit="50" stroke-width="1.5" href="#xnwwa"></use></g></g></g></svg>
          </button>
        </CartLineUpdateButton>
        &nbsp;
      </div>
      <CartLineRemoveButton lineIds={[lineId]} />
    </div>
  );
}

function CartLinePrice({
  line,
  priceType = 'regular',
  ...passthroughProps
}: {
  line: CartLine;
  priceType?: 'regular' | 'compareAt';
  [key: string]: any;
}) {
  if (!line?.cost?.amountPerQuantity || !line?.cost?.totalAmount) return null;

  const moneyV2 =
    priceType === 'regular'
      ? line.cost.totalAmount
      : line.cost.compareAtAmountPerQuantity;

  if (moneyV2 == null) {
    return null;
  }

  return (
    <div className='price price-styles'>
      <Money withoutTrailingZeros {...passthroughProps} data={moneyV2} />
    </div>
  );
}

export function CartEmpty({
  hidden = true,
  layout = 'aside',
}: {
  hidden: boolean;
  layout?: CartMainProps['layout'];
}) {
  return (
    <div className='empty-cart-styles' hidden={hidden}>
      <h2 className='empty-heading-styles'>
        Your Bag is Empty
      </h2>
      <hr style={{ borderColor: '#ccc' }} />
      <p className='empty-paragraph-styles'>Free worldwide shipping and easy returns</p>
      {/* <Link
        to="/collections"
        onClick={() => {
          if (layout === 'aside') {
            window.location.href = '/collections';
          }
        }}
      >
        Continue shopping →
      </Link> */}
    </div>
  );
}

function CartDiscounts({
  discountCodes,
}: {
  discountCodes: CartApiQueryFragment['discountCodes'];
}) {
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({ code }) => code) || [];
  return (
    <div>
      {/* Have existing discount, display it with a remove option */}
      <dl hidden={!codes.length}>
        <div>
          <dt>Discount(s)</dt>
          <UpdateDiscountForm>
            <div className="cart-discount">
              <code>{codes?.join(', ')}</code>
              &nbsp;
              <button>Remove</button>
            </div>
          </UpdateDiscountForm>
        </div>
      </dl>

      {/* Show an input to apply a discount */}
      <UpdateDiscountForm discountCodes={codes}>
        <div>
          <input type="text" name="discountCode" placeholder="Discount code" />
          &nbsp;
          <button type="submit">Apply</button>
        </div>
      </UpdateDiscountForm>
    </div>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}

function CartLineUpdateButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{ lines }}
    >
      {children}
    </CartForm>
  );
}

function CartDropDown() {
  const [dropdownState, setDropdownState] = useState(false);
  return (
    <div className="need-help-dropdown">
      <div className='dropdown-item'>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18"><defs><path id="rmeaa" d="M1305.865 879.119h-5.306a.6.6 0 0 0-.384.138l-3.138 2.869v-2.43a.566.566 0 0 0-.565-.578h-4.424c-1.06 0-1.92-.878-1.92-1.966v-8.029c0-1.087.858-1.967 1.92-1.967h13.817c1.06 0 1.92.88 1.92 1.967v8.029c0 1.087-.86 1.967-1.92 1.967zm0-13.119h-13.817c-1.67 0-3.048 1.41-3.048 3.123v8.029c0 1.712 1.377 3.123 3.048 3.123h3.86v3.147c0 .232.136.44.339.532a.777.777 0 0 0 .226.046.6.6 0 0 0 .383-.139l3.906-3.586h5.08c1.67 0 3.048-1.412 3.048-3.123v-8.029c.023-1.712-1.355-3.123-3.025-3.123z"></path></defs><g><g transform="translate(-1289 -866)"><g><use xlink: href="#rmeaa"></use></g></g></g></svg>
        <h3 className='h3-styles'>Need Help ?</h3>
        <img onClick={() => setDropdownState(!dropdownState)} src={dropdownState ? contractArrow : expandArrow} alt="expand-contract" width={'20px'} height={'20px'} />
        {
          dropdownState &&
          <div className='lists-dropdown'>
            <p>Visit our <a style={{ textDecoration: 'underline' }}>FAQ page</a> , call us at 855-793-3100 , or chat us using our live support:</p>
            <p>Mon-Fri: 6:00am-6:30pm PT</p>
            <p>Sat-Sun: 8:00am-4:30pm PT</p>
            <p style={{ margin: '0.8rem' }}><a style={{ textDecoration: 'underline' }}>Email us</a> anytime. If you contact us after business hours, we will get back to you the following business day.</p>
          </div>
        }
      </div>
    </div>
  )
}

function ReturnBlock() {
  return (
    <div>
      <div className='heading-block'>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21"><defs><path id="4k1pa" d="M1307.772 868.5v11.97l-8.352 2.645v-11.962zm-17.133 0l3.96 1.255-.037 3.159a.217.217 0 0 0 .06.153c.04.04.095.064.151.065a.217.217 0 0 0 .153-.062.217.217 0 0 0 .064-.151l.035-3.03 3.967 1.258v11.968l-8.353-2.646zm12.956-1.46l3.683 1.167-8.063 2.562-3.693-1.17zm-4.382-1.391l3.683 1.166-8.08 2.559-3.674-1.164zm-.006-.439a.214.214 0 0 0-.066.01l-8.733 2.774a.216.216 0 0 0-.125.053.216.216 0 0 0-.072.239v12.34a.216.216 0 0 0 .15.204l8.753 2.772a.216.216 0 0 0 .152.01h.004l8.78-2.78a.216.216 0 0 0 .15-.205v-12.419-.006-.003a.216.216 0 0 0-.183-.205l-8.747-2.773a.215.215 0 0 0-.063-.01z"></path></defs><g><g transform="translate(-1289 -864)"><use xlink: href="#4k1pa"></use><use fill="#fff" fill-opacity="0" stroke="#000" stroke-miterlimit="50" stroke-width=".5" xlink: href="#4k1pa"></use></g></g></svg>
        <h3 className='return-header'>Returns</h3>
      </div>
      <div className='return-description'>
        <p>We want you to love your Alo — ship back any items you don’t 100% love for a full refund within 30 days of purchase.<a>Here are the deets</a></p>
      </div>
    </div>
  )
}