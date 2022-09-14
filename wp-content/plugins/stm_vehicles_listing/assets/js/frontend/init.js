if (typeof (STMListings) == 'undefined') {
    var STMListings = {};

    STMListings.$extend = function (object, methods) {
        methods.prototype = jQuery.extend({}, object.prototype);
        object.prototype = methods;
    };
}

(function ($) {
    "use strict";

    STMListings.resetFields = function() {
        $(document).on('reset', 'select', function(e){
            $(this).val('');
            $(this).find('option').prop('disabled', false);
        });
    };

    STMListings.stm_ajax_login = function () {
        $(".stm-login-form form").on('submit', function (e) {
            e.preventDefault();

            $.ajax({
                type: "POST",
                url: ajaxurl,
                dataType: 'json',
                context: this,
                data: $(this).serialize() + '&action=stm_custom_login',
                beforeSend: function () {
                    $(this).find('input').removeClass('form-error');
                    $(this).find('.stm-listing-loader').addClass('visible');
                    $('.stm-validation-message').empty();

                    if ($(this).parent('.lOffer-account-unit').length > 0) {
                        $('.stm-login-form-unregistered').addClass('working');
                    }
                },
                success: function (data) {
                    if ($(this).parent('.lOffer-account-unit').length > 0) {
                        $('.stm-login-form-unregistered').addClass('working');
                    }

                    if (data.user_html) {
                        var $user_html = $(data.user_html).appendTo('#stm_user_info');
                        $('.stm-not-disabled, .stm-not-enabled').slideUp('fast', function () {
                            $('#stm_user_info').slideDown('fast');
                        });

                        $("html, body").animate({scrollTop: $('.stm-form-checking-user').offset().top}, "slow");
                        $('.stm-add-a-car-login-overlay,.stm-add-a-car-login').toggleClass('visiblity');

                        $('.stm-form-checking-user button[type="submit"]').removeClass('disabled').addClass('enabled');
                    }

                    if(data.restricted && data.restricted) {
                        $('.btn-add-edit').remove();
                    }

                    // insert plans select
                    if ( data.plans_select && $('#user_plans_select_wrap').length > 0 ) {
                        $( '#user_plans_select_wrap' ).html(vdata.plans_selectv);
                        $( '#user_plans_select_wrap select' ).select2();
                    }

                    $(this).find('.stm-listing-loader').removeClass('visible');
                    for (var err in data.errors) {
                        $(this).find('input[name=' + err + ']').addClass('form-error');
                    }

                    if (data.message) {
                        var message = $('<div class="stm-message-ajax-validation heading-font">' + data.message + '</div>').hide();

                        $(this).find('.stm-validation-message').append(message);
                        message.slideDown('fast');
                    }


                    if (typeof(data.redirect_url) !== 'undefined') {
                        window.location = data.redirect_url;
                    }
                }
            });
        });
    };

    STMListings.save_user_settings_success = function (data) {
        $(this).find('.stm-listing-loader').removeClass('visible');
        $('.stm-user-message').text(data.error_msg);

        $('.stm-image-avatar img').attr('src', data.new_avatar);

        if (data.new_avatar === '') {
            $('.stm-image-avatar').removeClass('hide-empty').addClass('hide-photo');
        } else {
            $('.stm-image-avatar').addClass('hide-empty').removeClass('hide-photo');
        }

    };

    STMListings.save_user_settings = function () {
        $('#stm_user_settings_edit').on('submit', function (e) {

            var formData = new FormData();

            /*Add image*/
            formData.append('stm-avatar', $('input[name="stm-avatar"]')[0].files[0]);

            /*Add text fields*/
            var formInputs = $(this).serializeArray();

            for (var key in formInputs) {
                if (formInputs.hasOwnProperty(key)) {
                    formData.append(formInputs[key]['name'], formInputs[key]['value']);
                }
            }

            formData.append('action', 'stm_listings_ajax_save_user_data');

            e.preventDefault();

            $.ajax({
                type: "POST",
                url: ajaxurl,
                dataType: 'json',
                context: this,
                data: formData,
                contentType: false,
                processData: false,
                beforeSend: function () {
                    $('.stm-user-message').empty();
                    $(this).find('.stm-listing-loader').addClass('visible');
                },
                success: STMListings.save_user_settings_success
            });
        })
    };

    STMListings.stm_logout = function () {
        $('body').on('click', '.stm_logout a', function (e) {
            e.preventDefault();
            $.ajax({
                url: ajaxurl,
                type: "POST",
                dataType: 'json',
                context: this,
                data: {
                    'action': 'stm_logout_user'
                },
                beforeSend: function () {
                    $('.stm_add_car_form .stm-form-checking-user .stm-form-inner').addClass('activated');
                },
                success: function (data) {
                    if (data.exit) {
                        $('#stm_user_info').slideUp('fast', function () {
                            $(this).empty();
                            $('.stm-not-enabled, .stm-not-disabled').slideDown('fast');
                            $("html, body").animate({scrollTop: $('.stm-form-checking-user').offset().top}, "slow");
                        });

                        $('.stm-form-checking-user button[type="submit"]').removeClass('enabled').addClass('disabled');

                        // clear plans select
                        if ( $('#user_plans_select_wrap').length > 0 ) {
                            $( '#user_plans_select_wrap' ).html( '<p style="color: #888888; font-size: 13px;">' + stm_login_to_see_plans + '</p>' );
                        }
                    }
                    
                    $('.stm_add_car_form .stm-form-checking-user .stm-form-inner').removeClass('activated');
                }
            });
        })
    };

    STMListings.stm_ajax_registration = function () {
        $(".stm-register-form form").on('submit', function (e) {
            e.preventDefault();
            $.ajax({
                type: "POST",
                url: ajaxurl,
                dataType: 'json',
                context: this,
                data: $(this).serialize() + '&action=stm_custom_register',
                beforeSend: function () {
                    $(this).find('input').removeClass('form-error');
                    $(this).find('.stm-listing-loader').addClass('visible');
                    $('.stm-validation-message').empty();
                },
                success: function (data) {
                    if (data.user_html) {
                        var $user_html = $(data.user_html).appendTo('#stm_user_info');
                        $('.stm-not-disabled, .stm-not-enabled').slideUp('fast', function () {
                            $('#stm_user_info').slideDown('fast');
                        });
                        $("html, body").animate({scrollTop: $('.stm-form-checking-user').offset().top}, "slow");

                        $('.stm-form-checking-user button[type="submit"]').removeClass('disabled').addClass('enabled');

                        // insert plans select
                        if ( data.plans_select && $('#user_plans_select_wrap').length > 0 ) {
                            $('#user_plans_select_wrap').html(data.plans_select);
                            $( '#user_plans_select_wrap select' ).select2();
                        }
                    }

                    if(data.restricted && data.restricted) {
                        $('.btn-add-edit').remove();
                    }

                    $(this).find('.stm-listing-loader').removeClass('visible');
                    for (var err in data.errors) {
                        $(this).find('input[name=' + err + ']').addClass('form-error');
                    }

                    if (data.redirect_url) {
                        window.location = data.redirect_url;
                    }

                    if (data.message) {
                        var message = $('<div class="stm-message-ajax-validation heading-font">' + data.message + '</div>').hide();

                        $(this).find('.stm-validation-message').append(message);
                        message.slideDown('fast');
                    }
                }
            });
        });
    };

    STMListings.initVideoIFrame = function () {
        $('.light_gallery_iframe').lightGallery({
            selector: 'this',
            iframeMaxWidth: '70%'
        });
    };

    $(document).ready(function () {

        STMListings.stm_ajax_login();
        STMListings.save_user_settings();
        STMListings.stm_logout();
        STMListings.resetFields();
        STMListings.stm_ajax_registration();


        $(document).on('change', '.stm-sort-by-options select', function () {
            $('input[name="sort_order"]').val($(this).val()).closest('form').trigger('submit');
        });

        $(document).on('change', '.ajax-filter select, .stm-sort-by-options select, .stm-slider-filter-type-unit', function () {
            $(this).closest('form').trigger('submit');
        });

        $(document).on('slidestop', '.ajax-filter .stm-filter-type-slider', function (event, ui) {
            $(this).closest('form').trigger('submit');
        });


        $('.stm_login_me a').on('click',function (e) {
            e.preventDefault();
            $('.stm-add-a-car-login-overlay,.stm-add-a-car-login').toggleClass('visiblity');
        });

        $('.stm-add-a-car-login-overlay').on('click',function (e) {
            $('.stm-add-a-car-login-overlay,.stm-add-a-car-login').toggleClass('visiblity');
        });

        $('.stm-big-car-gallery').lightGallery({
            selector: '.stm_light_gallery',
            mode : 'lg-fade'
        });

        STMListings.initVideoIFrame();

    });

})(jQuery);