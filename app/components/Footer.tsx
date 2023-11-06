import { useMatches, NavLink } from '@remix-run/react';
import type { FooterQuery } from 'storefrontapi.generated';
import AppStoreImage from '../../public/Download-App-apple.svg';
import Facebook from '../../public/facebook2021.svg';
import Instagram from '../../public/instagram2021.svg'
import Twitter from '../../public/twitter2021.svg';
import Youtube from '../../public/youtube2021.svg';

export function Footer({ menu }: FooterQuery) {
  return (
    <footer className="footer">
      <FooterMenu menu={menu} />
      <FooterMenuSecondBlock />
    </footer>
  );
}

function FooterMenu({ menu }: Pick<FooterQuery, 'menu'>) {
  const [root] = useMatches();
  const publicStoreDomain = root?.data?.publicStoreDomain;
  return (
    <div className="footer-items">
      <div className="footer-menu" >
        {(menu || FALLBACK_FOOTER_MENU).items.map((item) => {
          if (!item.url) return null;
          // if the url is internal, we strip the domain
          const url =
            item.url.includes('myshopify.com') ||
              item.url.includes(publicStoreDomain)
              ? new URL(item.url).pathname
              : item.url;
          const isExternal = !url.startsWith('/');
          return isExternal ? (
            <a href={url} key={item.id} rel="noopener noreferrer" target="_blank">
              {item.title}
            </a>
          ) : (
            <div>
              <div style={{ color: 'white', marginBottom: '20px', fontWeight: 'bold' }}>{item.title}</div>
              {item?.items?.map((item) => {
                return (<NavLink
                  end
                  key={item.id}
                  prefetch="intent"
                  style={activeLinkStyle}
                  to={url}
                >
                  {item.title}
                </NavLink>);
              })}
            </div>
          );
        })}
      </div>
      <ThirdBlock />
      <NewsletterBlock />
    </div >
  );
}

const FALLBACK_FOOTER_MENU = {
  id: 'gid://shopify/Menu/199655620664',
  items: [
    {
      id: 'gid://shopify/MenuItem/461633060920',
      resourceId: 'gid://shopify/ShopPolicy/23358046264',
      tags: [],
      title: 'Privacy Policy',
      type: 'SHOP_POLICY',
      url: '/policies/privacy-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633093688',
      resourceId: 'gid://shopify/ShopPolicy/23358013496',
      tags: [],
      title: 'Refund Policy',
      type: 'SHOP_POLICY',
      url: '/policies/refund-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633126456',
      resourceId: 'gid://shopify/ShopPolicy/23358111800',
      tags: [],
      title: 'Shipping Policy',
      type: 'SHOP_POLICY',
      url: '/policies/shipping-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633159224',
      resourceId: 'gid://shopify/ShopPolicy/23358079032',
      tags: [],
      title: 'Terms of Service',
      type: 'SHOP_POLICY',
      url: '/policies/terms-of-service',
      items: [],
    },
  ],
};

const FOOTERVALUES = [
  { value: "Terms", url: "" }, { value: "Privacy", url: "" }, { value: "Cookie Policy", url: "" }
]

const FOLLOWUSSECTION = [
  {
    name: "Facebook-Icon",
    icon: Facebook
  },
  {
    name: "Instagram-Icon",
    icon: Instagram
  },
  {
    name: "Twitter-Icon",
    icon: Twitter
  },
  {
    name: "Youtube-Icon",
    icon: Youtube
  }
]

function activeLinkStyle({
  isActive,
  isPending,
}: {
  isActive: boolean;
  isPending: boolean;
}) {
  return {
    //fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? 'grey' : 'white',
    display: 'block',
    marginBottom: '5px'
  };
}

function NewsletterBlock() {
  return (
    <div className="sign-up-newsletter-block">
      <p style={{ marginBottom: '20px' }}>Sign up for our newsletter - enter your email below</p>
      <input style={{ backgroundColor: 'black', color: 'white', border: 'solid 2px', borderRadius: 'none' }} placeholder='Enter your Email' />
      <button className='button-styles' type='submit' aria-label='Submit'> {'>'} </button>
      <div style={{ fontWeight: 'normal', fontSize: '0.8rem' }}>By entering your email address, you agree to our < a style={{ color: 'white', fontWeight: '1', textDecorationLine: 'underline' }}>Privacy Policy</a> and will receive Alo Yoga offers, promotions and other commercial messages. You may unsubscribe at any time.</div>
      <div className='follow-us-section'>
        <p style={{ color: 'white', paddingBottom: '10px' }}>
          Follow Us
        </p>
        {
          FOLLOWUSSECTION.map((item) => {
            return (
              <span className='icon-styling'>
                <a>
                  <img alt="Social Media Icon" src={item.icon} />
                </a>
              </span>
            )
          })
        }
      </div>
    </div>
  )
}

function ThirdBlock() {
  return (
    <div className='third-block'>
      <p style={{ marginBottom: '20px' }}>Get the App</p>
      <li className='third-block-list'>
        <a href="">
          <img src={AppStoreImage} alt="Alo App - iOS App Store" />
        </a>
      </li>
    </div>
  )
}

function FooterMenuSecondBlock() {
  return (
    <>
      <div className="footer-second-section">
        <p style={{ fontSize: '0.85rem' }}>For applicable countries, duties & taxes will be automatically calculated and displayed during checkout. Depending on the country, you will have the option to choose DDP (Delivery Duty Paid) or DDU (Delivery Duty Unpaid).</p>
      </div>
      <div className="footer-main-second-block" style={{ color: "white", marginTop: '10px' }}>
        <small>© 2023 Alo, LLC. All Rights Reserved.</small>
        {FOOTERVALUES.map((item) => {
          return <a style={{ color: 'white', margin: '0rem 1rem' }} href={item.url}>{item.value}</a>
        })
        }
      </div>
    </>
  )
}