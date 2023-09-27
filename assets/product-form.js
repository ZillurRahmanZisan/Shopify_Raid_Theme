if (!customElements.get('product-form')) {
  customElements.define('product-form', class ProductForm extends HTMLElement {
    constructor() {
      super();

      this.form = this.querySelector('form');
      this.form.querySelector('[name=id]').disabled = false;
      this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
      this.submitButton = this.querySelector('[type="submit"]');
      if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');
    }

    sectionRender(data,quickAddModal){
      if (quickAddModal) {
        document.body.addEventListener('modalClosed', () => {
          setTimeout(() => { this.cart.renderContents(data) });
        }, { once: true });
        quickAddModal.hide(true);
      } else {
        this.cart.renderContents(data);
      }
    };

    onSubmitHandler(evt) {
      evt.preventDefault();
      if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

      this.handleErrorMessage();

      this.submitButton.setAttribute('aria-disabled', true);
      this.submitButton.classList.add('loading');
      this.querySelector('.loading-overlay__spinner').classList.remove('hidden');

      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];
      console.log(config.headers)
      

      const formData = new FormData(this.form);

      if (this.cart) {        
        formData.append('sections', this.cart.getSectionsToRender().map((section) => section.id));
        formData.append('sections_url', window.location.pathname);
        // formData.append('items', JSON.stringify(cartData.items));
        // formData.append('id[0]', this.form.querySelector('[name=id]').value);
        this.cart.setActiveElement(document.activeElement);
      }
      
      config.body = formData;
      // config.body = JSON.stringify(Object.fromEntries(formData)); 

      fetch(`${routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then((response) => {
          console.log(response)
          if (response.status) {
            
            this.handleErrorMessage(response.description);

            const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
            if (!soldOutMessage) return;
            this.submitButton.setAttribute('aria-disabled', true);
            this.submitButton.querySelector('span').classList.add('hidden');
            soldOutMessage.classList.remove('hidden');
            this.error = true;
            return;
          } else if (!this.cart) {
            window.location = window.routes.cart_url;
            return;
          }

          this.error = false;
          const quickAddModal = this.closest('quick-add-modal');

          if(this.form.querySelector('[name=freeGift]')){
             formData.set('id', this.form.querySelector('[name=freeGift]').value);
            config.body = formData;
            
            fetch(`${routes.cart_add_url}`, config)
            .then(response => response.json())
            .then(data=>{
              console.log(data,"sadsad");
               this.sectionRender(data,quickAddModal)
            })
            .catch((error) => {
              console.error('Error:', error);
            });
          }else{
            this.sectionRender(response,quickAddModal)
          }

        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          this.submitButton.classList.remove('loading');
          if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
          if (!this.error) this.submitButton.removeAttribute('aria-disabled');
          this.querySelector('.loading-overlay__spinner').classList.add('hidden');
        });

    
    }

    handleErrorMessage(errorMessage = false) {
      this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
      if (!this.errorMessageWrapper) return;
      this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

      this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

      if (errorMessage) {
        this.errorMessage.textContent = errorMessage;
      }
    }
  });
}
