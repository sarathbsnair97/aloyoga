import {Image} from '@shopify/hydrogen';

const ProductCard = (imgUrl: any) => {
  return (
    <div className="position-relative">
      <div>
        <div className="wishlist-icon-wrapper">
          <img
            src="https://cdn.shopify.com/s/files/1/2185/2813/files/heart.png?v=1663365698"
            className="img-fluid wishlist-heart-icon "
            alt="Add to wishlist"
            width="10px"
          />
        </div>
      </div>
      <a
        href="/products/a0467u-district-trucker-hat-black-white"
        className="aspect-ratio-3x2-wrapper image-wrapper"
        tabIndex={-1}
      >
        <div className="product-carousel quick-add-carousel">
          <div className="quick-add-carousel-images normal ls-is-cached lazyloaded">
            <Image
              data={imgUrl.imgUrl}
              sizes="(min-width: 45em) 400px, 100vw"
            />
          </div>
        </div>
      </a>
      {/* <div className="quick-add quick-add-dark-mode" style={{ justifyContent: 'center' }}>
                <div className="quick-add-sizes">
                    <button type="button" data-variant="41853537616052" className="quick-add-size-btn add-to-bag" style={{ color: 'white',fontWeight:'200' }}>
                        add to bag
                    </button>
                </div>
            </div> */}
    </div>
  );
};

export default ProductCard;
