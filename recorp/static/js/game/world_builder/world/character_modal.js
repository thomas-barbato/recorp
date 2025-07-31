const user_description = document.querySelector('#usr-background');
let user_description_editor = "";
let editor_btn = document.querySelector('#edit-mod-btn');
let btn_group = document.querySelector('#btn-group');
let save_change_btn = document.querySelector('#save-edition-btn')
let discard_change_btn = document.querySelector('#cancel-edition-btn');
const reader = new FileReader();
const img_user = document.querySelector('#user-avatar');
const img_input = document.querySelector('.hidden-input-file');
let elem_popover = document.querySelectorAll('.popover-element')

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

    btn_group.classList.remove('hidden');
    editor_btn.classList.add('hidden');
});

function destroy_editor(){
    window.user_description_editor.destroy().catch( error => {
        console.log( error );
    } );
    btn_group.classList.add('hidden');
    editor_btn.classList.remove('hidden');
}

save_change_btn.addEventListener('click', function(){
    // TODO: ADD SAVE
    const data = window.user_description_editor.getData();
    destroy_editor();
    user_description.innerHTML = data;
})

discard_change_btn.addEventListener('click', function(){
    destroy_editor();
    user_description.innerHTML = JSON.parse(document.getElementById('description').textContent);
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

// DISPLAY SKILL DESCRIPTION ON PHONE ZONE

let skill = document.querySelectorAll('.skills')

for(let i = 0; i < skill.length ; i++){
    let id = skill[i].id.split('skill-')[1];
    let descr_elem = document.querySelector('#skill-descr-'+id);
    skill[i].addEventListener('click', function(){
        if(descr_elem.classList.contains("hidden")) {
            descr_elem.classList.remove('hidden');
        }else{
            descr_elem.classList.add('hidden');
        }
    })
}

// END OF SKILL DESCRIPTION ON PHONE ZONE

// DISABLE POPOVER ON MOBILE

const isMobileDevice = /Mobi/i.test(window.navigator.userAgent)

if(isMobileDevice){
    for(let i = 0; i < elem_popover.length; i++){
        elem_popover[i].removeAttribute('data-popover-target');
    }
}

// END OF DISABLE POPOVER ON MOBILE ZONE
