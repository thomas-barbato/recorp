let user_description = document.querySelector('#usr-background');
let user_description_editor = "";
let editor_btn = document.querySelector('#edit-mod-btn');
let close_editor_btn = document.querySelector('#cancel-edit-mod-btn');
const reader = new FileReader();
const img_user = document.querySelector('#user-avatar');
const img_input = document.querySelector('.hidden-input-file');

// CHARACTER BACKGROUND EDITOR

editor_btn.addEventListener('click', function(){
    ClassicEditor.create( document.querySelector('#usr-background'),{
        toolbar: [ 'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote'],
        heading: {
            options: [
                { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' }
            ]
        }
    })
    .then( editor => {
        "{% autoescape off %}"
        //let data = `{{ description_content|safe }}`;
        // editor.setData(data);
        window.user_description_editor = editor;
        "{% endautoescape %}"
    } )
    .catch( error => {
        console.error( error );
    });

    close_editor_btn.classList.remove('hidden');
    editor_btn.classList.add('hidden');
});

close_editor_btn.addEventListener('click', function(){
    const data = window.user_description_editor.getData();
    console.log(data)
    window.user_description_editor.destroy().catch( error => {
        console.log( error );
    } );
    user_description.innerHTML = data;
    editor_btn.classList.remove('hidden');
    close_editor_btn.classList.add('hidden');
})

// END OF CHARACTER BACKGROUND EDITOR

// CHANGE CHARACTER IMG ZONE

reader.onload = e => {
    img_user.src = e.target.result;
}

img_user.addEventListener('click',function(){
    img_input.click();
})

img_input.addEventListener('change', e => {
    const f = e.target.files[0];
    reader.readAsDataURL(f);
})

// END OF CHANGE CHARACTER IMG ZONE