(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission if invalid
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }
      form.classList.add('was-validated')
    }, false)
  })

  // Add event listeners for updating cart item quantity
  document.querySelectorAll('.update-cart').forEach(button => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const form = event.target.closest('form');
      const productId = form.querySelector('input[name="productId"]').value;
      const quantity = form.querySelector('input[name="quantity"]').value;

      try {
        const response = await fetch('/cart/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ productId, quantity })
        });

        if (response.ok) {
          const data = await response.json();
          document.querySelector(`#quantity-${productId}`).innerText = data.quantity;
          document.querySelector(`#price-${productId}`).innerText = data.totalPrice;
        } else {
          alert('Failed to update cart item. Please try again.');
        }
      } catch (error) {
        console.error('Error updating cart item:', error);
        alert('An error occurred while updating the cart item.');
      }
    });
  });

  // Add event listeners for removing items from cart
  document.querySelectorAll('.remove-from-cart').forEach(button => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const form = event.target.closest('form');
      const productId = form.querySelector('input[name="productId"]').value;

      try {
        const response = await fetch('/cart/remove', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ productId })
        });

        if (response.ok) {
          window.location.reload(); // Reload the page to reflect cart changes
        } else {
          alert('Failed to remove item from cart. Please try again.');
        }
      } catch (error) {
        console.error('Error removing cart item:', error);
        alert('An error occurred while removing the cart item.');
      }
    });
  });
})();
