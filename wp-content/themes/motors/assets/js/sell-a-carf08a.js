(function ($) {
	"use strict";

	var ListingForm = STMListings.ListingForm = function (form) {
		this.$form = $(form);
		this.formUser = $('.stm-form-checking-user');
		this.featuredId = 0;
		this.userFiles = [];
		this.orderChanged = false;
		this.init();
	};

	ListingForm.prototype.init = function () {
		this.$loader = $('.stm-add-a-car-loader');
		this.$message = $('.stm-add-a-car-message');

		this.$form.on('submit', $.proxy(this.submit, this));

		this.$form.on('change', 'input[name^="stm_car_gallery_add"]', $.proxy(this.onImagePicked, this));

		$(document).on('touchend click', '.stm-media-car-gallery .stm-placeholder .inner .stm-image-preview .fas', $.proxy(this.imageRemove, this));

		$('.stm-media-car-gallery .stm-placeholder').droppable({
			drop: $.proxy(this.onDropped, this)
		});
	};

	ListingForm.prototype.submit = function (e) {
		e.preventDefault();

        var loadType = $('input[name="btn-type"]').val();
        this.$loader = $('.stm-add-a-car-loader.' + loadType);

		$.ajax({
			url: ajaxurl,
			type: "POST",
			dataType: 'json',
			context: this,
			data: this.submitData(),
			beforeSend: function () {
				this.$loader.addClass('activated');
				this.$message.slideUp();
			},
			success: this.success
		});

	};

	ListingForm.prototype.submitData = function () {
		var gdpr = '';

		if (typeof this.formUser.find('input[name="motors-gdpr-agree"]')[0] !== 'undefined') {
			var gdprAgree = (this.formUser.find('input[name="motors-gdpr-agree"]')[0].checked) ? 'agree' : 'not_agree';
			gdpr = '&motors-gdpr-agree=' + gdprAgree;
		}

		return this.$form.serialize() + gdpr + '&action=stm_ajax_add_a_car&security=' + stm_security_nonce;
	};

	ListingForm.prototype.success = function (data) {
		this.$loader.removeClass('activated');
		$('.stm-form-checking-user button[type="submit"]').removeClass().addClass('enabled');

		if (data.message) {
			if (typeof data.html !== 'undefined') {
				this.$message.html(data.message).slideDown();
			} else {
				this.$message.html(data.message).slideDown();
			}
		}

		if (data.post_id) {
			this.$message.html(data.message).slideDown();
			this.$loader.addClass('activated');

			if (typeof(this.userFiles) !== 'undefined') {
				if (!this.orderChanged) {
					this.sortImages();
				}

				this.uploadImages.call(this, data);
			}
		}
	};

	ListingForm.prototype.uploadImages = function (data) {
		var fd = new FormData();

		if (this.$form.closest('.stm_edit_car_form').length) {
			fd.append('stm_edit', 'update');
		}

		fd.append('action', 'stm_ajax_add_a_car_media');
		fd.append('security', stm_security_nonce);
		fd.append('post_id', data.post_id);
		fd.append('redirect_type', data.redirect_type);

		$.each(this.userFiles, function (i, file) {
			if (typeof(file) !== undefined) {
				if (typeof(file) !== 'number') {
					fd.append('files[' + i + ']', file);
				} else {
					fd.append('media_position_' + i, file);
				}
			}
		});

		$.ajax({
			type: 'POST',
			url: ajaxurl,
			data: fd,
			contentType: false,
			processData: false,
			context: this,
			success: function (response) {

				if (typeof(response) != 'object') {
					var responseObj = JSON.parse(response);
				} else {
					var responseObj = response;
				}
				if (responseObj.allowed_posts) {
					$('.stm-posts-available-number span').text(responseObj.allowed_posts);
				}
				this.$loader.removeClass('activated');
				if (responseObj.message) {
					this.$message.html(responseObj.message).slideDown();
				}
				if (responseObj.url) {
					window.location = responseObj.url;
				}
			}
		});
	};

	ListingForm.prototype.sortImages = function () {
        $(".stm-media-car-gallery .stm-placeholder").each(function () {
            $(this).trigger('blur');
            $(this).find(".inner").removeClass("active");
            $(this).find(".stm-image-preview").trigger('blur');
        });

        var _this = this;

		setTimeout(function () {
			var tmpArr = [];

			$('.stm-placeholder.stm-placeholder-generated').each(function (i, e) {
				/*Get old id*/
				var oldId = $(this).find('.stm-image-preview').attr('data-id');

				/*Set new ids to preview and to delete icon*/
				$(this).find('.stm-image-preview').attr('data-id', i);
				$(this).find('.stm-image-preview .fas').attr('data-id', i);

				if (typeof(_this.userFiles[oldId]) !== 'undefined') {
					tmpArr[i] = _this.userFiles[oldId];
				}
			});

			_this.featuredId = 0;
			_this.userFiles = tmpArr;
		}, 100);
	};

    ListingForm.prototype.onImagePicked = function (event) {
        var wasEmpty = this.userFiles.length === 0, _this = this;

        [].forEach.call($(event.target)[0].files, function (file) {

            if (typeof(file) === 'object' && file.type.match(/^image/)) {
				_this.userFiles.push(file);
                var index = _this.userFiles.length - 1;

                if (index === 0 && wasEmpty) {
					_this.featuredId = index;
                    $('.stm-media-car-main-input')
                        .find('.stm-image-preview').remove().end()
                        .append('<div class="stm-image-preview" data-id="' + index + '"></div>');
                }

                $('.stm-placeholder-native').remove();
                $('.stm-media-car-gallery')
                    .append(
                        '<div class="stm-placeholder stm-placeholder-generated"><div class="inner">' +
                        '<div class="stm-image-preview" data-id="' + index + '"><i class="fas fa-times" data-id="' + index + '"></i></div>' +
                        '</div></div>'
                    );

                loadImage(
                    file,
                    function (img) {
                        $('.stm-image-preview[data-id="' + index + '"]').css('background-image', 'url(' + img.toDataURL() + ')');
						$('.stm-media-car-gallery .stm-placeholder').stop().droppable({
							drop: $.proxy(_this.onDropped, _this),
							delay: 200
						});
                    },
                    {
                        orientation: true,
                        canvas: true
                    }
                );
            }
        });

        if (this.userFiles.length > 0) {
            $('.stm-media-car-main-input .stm-placeholder').addClass('hasPreviews');
        } else {
            $('.stm-media-car-main-input .stm-placeholder').removeClass('hasPreviews');
        }

        $('.stm_add_car_form input[type="file"]').val('');
    };

	ListingForm.prototype.onDropped = function (event, ui) {
		var dragFrom = ui.draggable.closest('.inner');
		var dragTo = $(event.target).find('.inner');
		var dragToPreview = dragTo.find('.stm-image-preview');

		if (ui.draggable.length > 0 && dragToPreview.length > 0 && dragTo.length > 0 && dragFrom.length > 0) {

			if (dragFrom[0] !== dragTo[0]) {

				ui.draggable.clone().appendTo(dragTo);
				dragToPreview.clone().appendTo(dragFrom);


				/*If placed in first pos*/
				if (dragTo.closest('.stm-placeholder').index() === 0) {
					$('.stm-media-car-main-input .stm-image-preview').remove();
					ui.draggable.clone().appendTo('.stm-media-car-main-input');
					this.featuredId = ui.draggable.data('id');
				}

				/*If moving from first place*/
				if (ui.draggable.closest('.stm-placeholder').index() === 0) {
					$('.stm-media-car-main-input .stm-image-preview').remove();
					dragToPreview.clone().appendTo('.stm-media-car-main-input');
					this.featuredId = dragToPreview.data('id');
				}

				ui.draggable.remove();
				dragToPreview.remove();

				this.sortImages();
				this.orderChanged = true;
			}
		}
	};

	ListingForm.prototype.imageRemove = function (event) {
		var stm_id = $(event.target).attr('data-id');
		var stm_length = 0;
		delete this.userFiles[stm_id];
		$('.stm-placeholder .inner').removeClass('deleting');

		$(event.target).closest('.stm-placeholder').remove();

		$(this.userFiles).each(function (i, e) {
			if (typeof(e) !== 'undefined') {
				stm_length++;
			}
		});

		if (stm_length === 0) {
			$('.stm-media-car-main-input .stm-image-preview').remove();
			$('.stm-media-car-main-input .stm-placeholder').removeClass('hasPreviews');
			var defaultPlaceholders = '';
			for (var i = 0; i < 5; i++) {
				defaultPlaceholders += '<div class="stm-placeholder stm-placeholder-native"><div class="inner"><i class="stm-service-icon-photos"></i></div></div>';
			}

			$('.stm-media-car-gallery').append(defaultPlaceholders);
		}

		if (this.featuredId === parseInt(stm_id)) {
			var changeFeatured = $('.stm-media-car-gallery .stm-placeholder:nth-child(1)');
			this.featuredId = changeFeatured.find('.stm-image-preview').attr('data-id');

			$('.stm-media-car-main-input .stm-image-preview').remove();
			$(changeFeatured).find('.stm-image-preview').clone().appendTo('.stm-media-car-main-input');
		}

		this.sortImages();
	};

	$(document).ready(function () {

		var $form = $('#stm_sell_a_car_form'), listingForm = new ListingForm($form);

		//window.hasOwnProperty = window.hasOwnProperty || Object.prototype.hasOwnProperty;

		/*Sell a car*/
		if (typeof stmUserFilesLoaded !== 'undefined') {
			listingForm.userFiles = stmUserFilesLoaded;
		}

		$(document).on('mouseenter touchstart', '.stm-media-car-gallery .stm-placeholder .inner .stm-image-preview .fas', function () {
			$(this).closest('.inner').addClass('deleting');
		});

		$(document).on('mouseleave touchend', '.stm-media-car-gallery .stm-placeholder .inner .stm-image-preview .fas', function () {
			$(this).closest('.inner').removeClass('deleting');
		});

		/*Droppable*/
		$(document).on("mouseenter touchstart", '.stm-media-car-gallery .stm-placeholder .inner .stm-image-preview', function (e) {
			$(this).draggable({
				revert: 'invalid',
				helper: "clone"
			})
		});

		$(document).on("mouseenter touchstart click", ".stm-media-car-gallery .stm-placeholder .inner", function () {
			$(".stm-media-car-gallery .stm-placeholder").each(function () {
				$(this).trigger('blur');
				$(this).find(".inner").removeClass("active");
				$(this).find(".stm-image-preview").trigger('blur');
            });

			$(this).addClass("active");
        });

		$('.stm-form-checking-user button[type="submit"]').on('click', function (e) {
			e.preventDefault();
			if (!$(this).hasClass('disabled')) {
                var loadType = $(this).attr('data-load');
                $('input[name="btn-type"]').val(loadType);

				$(this).removeClass().addClass('disabled');
				$form.trigger('submit');
			}
		});

	});

})(jQuery);