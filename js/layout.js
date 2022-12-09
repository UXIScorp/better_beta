$(function(){
	$('.menuicon').click(function(event) {
		$('.menuPop').fadeIn();			
	});
	
	$('.cancelicon').click(function(event) {
		$('.menuPop').fadeOut();
	});

	$('#share').click(function(event) {
		$('.menuPop').fadeOut();
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
			}else{			
				btns.removeClass('active');
				$(this).addClass('active');
				$('.cont .inner').addClass('on');

				var targetClassName = $(this).attr('data-name');
				$('.right_pop').removeClass('on');
				$('.'+ targetClassName).addClass('on');
				$('.many_wrap').addClass('on');
				$('.w_sec01 .view_all').addClass('on');
			}
		});

		var closeBtn = $('.right_pop').find('.close');
		closeBtn.on('click', function(){
			btns.removeClass('active');
			$('.right_pop').removeClass('on');
			$('.many_wrap').removeClass('on');
			$('.w_sec01 .view_all').removeClass('on');
			$('.cont .inner').removeClass('on');
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

	$('.header .r_hcont .second .h_btn.share').click(function(event) { 
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
});