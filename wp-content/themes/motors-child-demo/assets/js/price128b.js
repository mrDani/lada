(function ($) {
    $(document).ready(function () {
        var api_url = 'https://stylemixthemes.scdn2.secure.raxcdn.com/api/prices.json';

        $.ajax({
            url: api_url,
            dataType: 'json',
            context: this,
            complete: function (data) {
                var r = data.responseJSON;
                $('#stm_price_api').text(r.themes.motors.price);
            }
        });

        $('#crypterio-demos').on('click', function () {
            $('.lazyload').each(function () {
                $(this).attr('src', $(this).data('src'));
                $(this).removeClass('lazyload').addClass('lazyloaded');
            });
        });

    });
})(jQuery);