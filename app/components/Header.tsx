import { Await, NavLink, useMatches } from '@remix-run/react';
import { Suspense } from 'react';
import type { LayoutProps } from './Layout';

type HeaderProps = Pick<LayoutProps, 'header' | 'cart' | 'isLoggedIn'>;

type Viewport = 'desktop' | 'mobile';

export function Header({ header, isLoggedIn, cart }: HeaderProps) {
  const { shop, menu, } = header;
  return (
    <header className="header">
      <NavLink prefetch="intent" to="/" style={activeLinkStyle} end>
        <svg className="alo-logo__svg" viewBox="0 0 71 48" width="71" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.826 19.591h5.771v27.43h-5.77v-1.928A13.973 13.973 0 0114.298 48C6.414 48 0 41.409 0 33.306c0-8.103 6.414-14.694 14.299-14.694 3.193 0 6.145 1.082 8.527 2.907zm-.145 13.715c0-4.861-3.76-8.816-8.382-8.816-4.623 0-8.382 3.955-8.382 8.816 0 4.862 3.76 8.816 8.382 8.816s8.382-3.954 8.382-8.816zM39.434 47.02h-5.906V0h5.906zm2.969-13.714c0-8.103 6.414-14.694 14.298-14.694C64.586 18.612 71 25.203 71 33.306 71 41.41 64.586 48 56.701 48s-14.298-6.591-14.298-14.694zm5.916 0c0 4.862 3.76 8.816 8.382 8.816 4.623 0 8.382-3.954 8.382-8.816 0-4.861-3.76-8.816-8.382-8.816s-8.382 3.955-8.382 8.816z"></path>
          <desc>Alo</desc>
        </svg>
      </NavLink>
      <HeaderMenu menu={menu} viewport="desktop" />
      <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
      <div className="inner">&nbsp;</div>
    </header>
  );
}


export function HeaderMenu({
  menu,
  viewport,
}: {
  menu: HeaderProps['header']['menu'];
  viewport: Viewport;
}) {
  const [root] = useMatches();
  const TopMenuHover = (event: any) => {
    console.log(event);
    let main = document.querySelectorAll('main');
    main.forEach(a => {
      a.classList.add('background-blur-active');
    });

    let otherTopNav = document.querySelectorAll('header nav > .header-menu');
    otherTopNav.forEach(top => {
      top.classList.remove('active');
    })
    event.target.closest('.header-menu').classList.add('active');
  }

  const DropdownOut = (event: any) => {
    event.target.closest('.header-menu').classList.remove('active');
    let main = document.querySelectorAll('main');
    main.forEach(p => {
      p.classList.remove('background-blur-active');
    });

  }

  const publicStoreDomain = root?.data?.publicStoreDomain;
  const className = `header-menu-${viewport} flex gap-8`;

  function closeAside(event: React.MouseEvent<HTMLAnchorElement>) {
    if (viewport === 'mobile') {
      event.preventDefault();
      window.location.href = event.currentTarget.href;
    }
  }

  return (
    <nav className={className}>
      {viewport === 'mobile' && (
        <NavLink
          end
          onClick={closeAside}
          prefetch="intent"
          style={activeLinkStyle}
          to="/"
        >
          Home
        </NavLink>
      )}
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;
        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
            item.url.includes(publicStoreDomain)
            ? new URL(item.url).pathname
            : item.url;
        return (
          <div className='header-menu' key={"header-menu--" + item.id}>
            <NavLink
              className="header-menu-item"
              end
              key={item.id}
              onClick={closeAside}
              prefetch="intent"
              style={activeLinkStyle}
              to={url}
              target={item.url}
              onMouseEnter={TopMenuHover}
            >
              {item.title}
            </NavLink>

            {item.items.length > 0 && (
              <div className='drop-down' key={"drop-down--" + item.id} onMouseLeave={DropdownOut}>
                {item.items.map((submenu) => {
                  if (!submenu.url) return null;
                  // if the url is internal, we strip the domain
                  const url =
                    submenu.url.includes('myshopify.com') ||
                      submenu.url.includes(publicStoreDomain)
                      ? new URL(submenu.url).pathname
                      : submenu.url;
                  return (
                    <NavLink
                      end
                      key={submenu.id}
                      onClick={closeAside}
                      prefetch="intent"
                      target={submenu.url}
                      style={activeItemStyle}
                      to={url}
                    >
                      {submenu.title}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function HeaderCtas({
  isLoggedIn,
  cart,
}: Pick<HeaderProps, 'isLoggedIn' | 'cart'>) {
  return (
    <nav className="header-ctas" role="navigation">
      <HeaderMenuMobileToggle />
      <SearchToggle />
      <NavLink prefetch="intent" to="/account" style={activeLinkStyle}>
        <div id='userLogoDiv'>
          <img className='userLogo' />&nbsp;{isLoggedIn ? 'Account' : 'SIGN IN TO GET REWARDS'}
        </div>
      </NavLink>
      <CartToggle cart={cart} />
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  return (
    <a className="header-menu-mobile-toggle" href="#mobile-menu-aside">
      <h3>☰</h3>
    </a>
  );
}

function SearchToggle() {
  return <a href='#search-aside'><img className="searchIcon" /></a>;
}

function CartBadge({ count }: { count: number }) {
  return <a href="#cart-aside" className='cart'><span className='count'>{count}</span><img className='cartIcon' /> </a>;
}

function CartToggle({ cart }: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        {(cart) => {
          if (!cart) return <CartBadge count={0} />;
          return <CartBadge count={cart.totalQuantity || 0} />;
        }}
      </Await>
    </Suspense>
  );
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};

function activeLinkStyle({
  isActive,
  isPending,
}: {
  isActive: boolean;
  isPending: boolean;
}) {
  return {
    // fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? 'grey' : 'black',
  };
}
function activeItemStyle({
  isActive,
  isPending,
}: {
  isActive: boolean;
  isPending: boolean;
}) {
  return {
    // fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? 'grey' : 'black',
  };
}
