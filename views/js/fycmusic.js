function formSubmit(value){
    document.getElementById('bucomit').value=value;
    document.getElementById('comit').submit();
}
$(function(){
    $('.nav__trigger').on('click', function(e){
        e.preventDefault();
        $(this).parent().toggleClass('nav--active');
    });
})