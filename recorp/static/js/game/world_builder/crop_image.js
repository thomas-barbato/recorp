  let img_preview = document.querySelector('#img-preview');
   let img_input = document.querySelector('#id_img_input');
   const reader = new FileReader();

   reader.onload = e => {
       img_preview.src = e.target.result;
   }

   img_input.addEventListener('change', e => {
       const f = e.target.files[0];
       reader.readAsDataURL(f);
   })

   var element = document.querySelector('.messagelist');

   function fadeOut(el) {
      var opacity = 1; // Initial opacity
      var interval = setInterval(function() {
         if (opacity > 0) {
            opacity -= 0.1;
            el.style.opacity = opacity;
         } else {
            clearInterval(interval); // Stop the interval when opacity reaches 0
            el.style.display = 'none'; // Hide the element
         }
      }, 50);
   }