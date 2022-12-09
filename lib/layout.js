$(function(){
	$('.menuicon').click(function(event) {
		$('.menuPop').fadeIn();			
	});
	
	$('.menuPop .cancelicon').click(function(event) {
		$('.menuPop').fadeOut();
	});

	$('#share').click(function(event) {
		$('.menuPop').fadeOut();
	});

	$('.cameraswitch').click(function(event) {
		$('.cameramenuPop').fadeIn();	
	});

	$('.cameramenuPop .cancelicon').click(function(event) {
		$('.cameramenuPop').fadeOut();	
	});
	
	var chatIncome = $('.chat_box').find('.close');
	chatIncome.on('click',function(){
		$(this).removeClass('on').addClass('off');
		$('.h_btn.chat').removeClass('on').addClass('off');
		$('.chat_box').removeClass('on');
        $('.cont .inner').removeClass('on');
		$('.many_wrap').removeClass('on');
		$('.w_sec01 .view_all').removeClass('on');
	})

	function right_btn(){
		
		var btns = $('.b_right .right_btn')
		btns.on('click', function(){
			
			if($(this).hasClass('active')){
				btns.removeClass('active');
				$('.right_pop').removeClass('on');
				$('.many_wrap').removeClass('on');
				$('.w_sec01 .view_all').removeClass('on');
				$('.cont .inner').removeClass('on');
				$('.cont .inner ul li .v_btn').removeClass('chatopen');
			}else{			
				btns.removeClass('active');
				$(this).addClass('active');
				$('.cont .inner').addClass('on');

				var targetClassName = $(this).attr('data-name');
				$('.right_pop').removeClass('on');
				$('.'+ targetClassName).addClass('on');
				$('.many_wrap').addClass('on');
				$('.w_sec01 .view_all').addClass('on');
				$('.cont .inner ul li .v_btn').addClass('chatopen');
			}
			
		});

		var closeBtn = $('.right_pop').find('.close');
		closeBtn.on('click', function(){
			btns.removeClass('active');
			$('.right_pop').removeClass('on');
			$('.many_wrap').removeClass('on');
			$('.w_sec01 .view_all').removeClass('on');
			$('.cont .inner').removeClass('on');
			$('.cont .inner ul li .v_btn').removeClass('chatopen');
		});

	}
	right_btn();

	function right_pop_scrollCustum_Fn(){

		var right_pop_scroll = $('.right_pop .scroll');

		if(!right_pop_scroll.length) return;

		right_pop_scroll.scrollbar({
			disableBodyScroll:true,
			autoUpdate:true,
			autoScrollSize:true,
		});
	}right_pop_scrollCustum_Fn();

	$('.header .r_hcont .second .h_btn.share').click(function(event) {   //공유버튼
		var self = $(this);	
		if (self.hasClass("off")) {
			$('.header .r_hcont .second .h_btn.p_people').removeClass("on").addClass("off");
			self.removeClass("off").addClass("on");
		}else{
			self.removeClass('on').addClass('off');
		}
	});

	function slide_box_slideFn(){
		var slide_boxTy01 = $('.slide_box.ty01');

		if(!slide_boxTy01.length) return;

		slide_boxTy01.slick({		
			slidesToShow : 1,		
			slidesToScroll : 1,	
			arrows : false, 	
			dots :true, 	
			autoplay : false,		
			autoplaySpeed : 6000, 
			dotsClass : "slick-dots", 
		});
	}slide_box_slideFn();

	function list_slide_box_slideFn(){
		var list_slide_box = $('.list_slide_box');

		if(!list_slide_box.length) return;

		list_slide_box.slick({		
			slidesToShow : 1,		
			slidesToScroll : 1,		
			arrows : true, 
			prevArrow: $('.prev'),
			nextArrow: $('.next'),
			dots :false, 	
			autoplay : false,		
			autoplaySpeed : 6000, 
			
		});
	}list_slide_box_slideFn();

	var rangeInputs = document.querySelectorAll('input[type="range"]')
	var numberInput = document.querySelectorAll('input[type="number"]')

	function handleInputChange(e) {
	  var target = e.target
	  if (e.target.type !== 'range') {
		target = document.getElementById('range')
	  } 
	  var min = target.min
	  var max = target.max
	  var val = target.value
	  
	  target.style.backgroundSize = (val - min) * 100 / (max - min) + '% 100%'
	}

	for(var i=0; i < rangeInputs.length; i++) {
	  rangeInputs[i].addEventListener('input', handleInputChange)
	}
	for(var i=0; i < numberInput.length; i++) {
	  numberInput[i].addEventListener('input', handleInputChange)
	}

	function scrCustom_Fn(){
		
		var customObj = $('.scrCustom');
		customObj.each(function(){
		
			$(this).scrollbar({
				disableBodyScroll:true,
			});
		});
	};
	scrCustom_Fn();

	function datepicker_Fn(){
		var datepicker = $('.datepicker');
		
		if(!datepicker.length) return;
		
		datepicker.each(function(){
			$(this).datepicker({
				dateFormat:'yy-mm-dd',
				changeMonth: true,
				changeYear: true,
				showOtherMonths: true,
				selectOtherMonths: true,
				showButtonPanel:true,
				monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
	            monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
	            dayNames: ['일', '월', '화', '수', '목', '금', '토'],
	            dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
	            dayNamesMin: ['일', '월', '화', '수', '목', '금', '토'],
				buttonImage: "../share/img/dpic_icon.svg",
	            showOn:"both",
			});
		});

		$.datepicker._gotoToday = function(id) {
			$(id).datepicker('setDate', new Date()).datepicker('hide').blur();
		};
	};
	datepicker_Fn();

	(function layerPop_close_Fn(){
		
		$(document).on('click','.layerpop-closeFn',function(e){
			
			e.preventDefault();
			var parentPop = $(this).parents('.layerPop-wrap');

			setTimeout(function(){
				$('html').css('paddingRight', 0);
				$('header').css('paddingRight', 0);
				$('html, body').removeClass('no-scr');
			
				parentPop.fadeOut(200,function(){
					parentPop.find('.layerPop').hide(200);
				});
			},300);
		});
	})();
});


$.fn.extend({
	modal: function(action){
		
		var _this = this;
		var layerPop = $(_this).find('.layerPop');
		var scrollbarWidth = (window.innerWidth - document.body.clientWidth) + 'px';	
		
		if(action == 'show'){

			$('html').css('paddingRight', scrollbarWidth);
			$('html, body').addClass('no-scr');
			_this.fadeIn(200);
			
			setTimeout(function(){
				layerPop.fadeIn(200);
			},100)
			
		}else if (action == 'hide'){
								
			setTimeout(function(){
				$('html').css('paddingRight', 0);
				$('header').css('paddingRight', 0);
				$('html, body').removeClass('no-scr');

				_this.fadeOut(200,function(){
					layerPop.hide(200);
				});
			},300);
		}
		
		_this.on('click',function(e){
			if(e.target.classList.contains("layerPop-flex")){

				setTimeout(function(){
					$('html').css('paddingRight', 0);
					$('header').css('paddingRight', 0);
					$('html, body').removeClass('no-scr');
	
					_this.fadeOut(200,function(){
						layerPop.hide(200);
					});
				},300);
			}
		})
	}
});