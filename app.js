$(function(){
  
    function set(key, value) { localStorage.setItem(key, value); }
    function get(key)        { return localStorage.getItem(key); }
    function increase(el)    { set(el, parseInt( get(el) ) + 1); }
    function decrease(el)    { set(el, parseInt( get(el) ) - 1); }
  
    var toTime = function(nr){
      if(nr == '-:-') return nr;
      else { var n = ' '+nr/1000+' '; return n.substr(0, n.length-1)+'s'; }
    };
  
    function updateStats(){
      $('#stats').html('<div class="padded"><h2>Figuras: <span>'+
        '<b>'+get('vira_vitoria')+'</b><i>Vitoria</i>'+
        '<b>'+get('vira_perdeu')+'</b><i>Perdeu</i>'+
        '<b>'+get('vira_abandonou')+'</b><i>Abandonou</i></span></h2>'+
        '<ul><li><b>Melhor Casual:</b> <span>'+toTime( get('vira_casual') )+'</span></li>'+
        '<li><b>Melhor Médio:</b> <span>'+toTime( get('vira_medium') )+'</span></li>'+
        '<li><b>Melhor Difícil:</b> <span>'+toTime( get('vira_hard') )+'</span></li></ul>'+
        '<ul><li><b>Total Viradas:</b> <span>'+parseInt( ( parseInt(get('vira_combinadas')) + parseInt(get('vira_erradas')) ) * 2)+'</span></li>'+
        '<li><b>Viradas Certas:</b> <span>'+get('vira_combinadas')+'</span></li>'+
        '<li><b>Viradas Erradas:</b> <span>'+get('vira_erradas')+'</span></li></ul></div>');
    };
  
    function shuffle(array) {
      var currentIndex = array.length, temporaryValue, randomIndex;
      while (0 !== currentIndex) {
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex -= 1;
          temporaryValue = array[currentIndex];
          array[currentIndex] = array[randomIndex];
          array[randomIndex] = temporaryValue;
      }
      return array;
    };
  
    function startScreen(text){
      $('#g').removeAttr('class').empty();
      $('.logo').fadeIn(250);
  
      $('.c1').text(text.substring(0, 1));
      $('.c2').text(text.substring(1, 2));
      $('.c3').text(text.substring(2, 3));
      $('.c4').text(text.substring(3, 4));
  
      // If vitoria game
      if(text == 'nice'){
        increase('vira_vitoria');
        decrease('vira_abandonou');
      }
  
      // If lost game
      else if(text == 'fail'){
        increase('vira_perdeu');
        decrease('vira_abandonou');
      }
  
      // Update stats
      updateStats();
    };
  
    /* LOAD GAME ACTIONS */
  
    // Init localStorage
    if( !get('vira_vitoria') && !get('vira_perdeu') && !get('vira_abandonou') ){
      //Overall Game stats
      set('vira_vitoria', 0);
      set('vira_perdeu', 0);
      set('vira_abandonou', 0);
      //Best times
      set('vira_casual', '-:-');
      set('vira_médio', '-:-');
      set('vira_difício', '-:-');
      //Cards stats
      set('vira_combinadas', 0);
      set('vira_erradas', 0);
    }
  
    // Fill stats
    if( get('vira_vitoria') > 0 || get('vira_perdeu') > 0 || get('vira_abandonou') > 0) {updateStats();}
  
    // Toggle start screen cards
    $('.logo .card:not(".twist")').on('click', function(e){
      $(this).toggleClass('active').siblings().not('.twist').removeClass('active');
      if( $(e.target).is('.playnow') ) { $('.logo .card').last().addClass('active'); }
    });
  
    // Start game
    $('.play').on('click', function(){
      increase('vira_abandonou');
          $('.info').fadeOut();
  
      var difficulty = '',
          timer      = 1000,
          level      = $(this).data('level');
  
      // Set game timer and difficulty   
      if     (level ==  8) { difficulty = 'casual'; timer *= level * 4; }
      else if(level == 18) { difficulty = 'medium'; timer *= level * 5; }
      else if(level == 32) { difficulty = 'hard';   timer *= level * 6; }	    
  
      $('#g').addClass(difficulty);
  
      $('.logo').fadeOut(250, function(){
        var startGame  = $.now(),
            obj = [];
  
        // Create and add shuffled cards to game
        for(i = 0; i < level; i++) { obj.push(i); }
  
        var shu      = shuffle( $.merge(obj, obj) ),
            cardSize = 100/Math.sqrt(shu.length);
  
        for(i = 0; i < shu.length; i++){
          var code = shu[i];
          if(code < 10) code = "0" + code;
          if(code == 30) code = 10;
          if(code == 31) code = 21;
          $('<div class="card" style="width:'+cardSize+'%;height:'+cardSize+'%;">'+
              '<div class="flipper"><div class="f"></div><div class="b" data-f="&#xf0'+code+';"></div></div>'+
            '</div>').appendTo('#g');
        }
  
        // Set card actions
        $('#g .card').on({
          'mousedown' : function(){
            if($('#g').attr('data-paused') == 1) {return;}
            var data = $(this).addClass('active').find('.b').attr('data-f');
  
            if( $('#g').find('.card.active').length > 1){
              setTimeout(function(){
                var thisCard = $('#g .active .b[data-f='+data+']');
  
                if( thisCard.length > 1 ) {
                  thisCard.parents('.card').toggleClass('active card found').empty(); //yey
                  increase('vira_combinadas');
  
                  // Win game
                  if( !$('#g .card').length ){
                    var time = $.now() - startGame;
                    if( get('vira_'+difficulty) == '-:-' || get('vira_'+difficulty) > time ){
                      set('vira_'+difficulty, time); // increase best score
                    }
  
                    startScreen('nice');
                  }
                }
                else {
                  $('#g .card.active').removeClass('active'); // fail
                  increase('vira_erradas');
                }
              }, 401);
            }
          }
        });
  
        // Add timer bar
        $('<i class="timer"></i>')
          .prependTo('#g')
          .css({
            'animation' : 'timer '+timer+'ms linear'
          })
          .one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function(e) {
            startScreen('fail'); // fail game
          });
  
        // Set keyboard (p)ause and [esc] actions
        $(window).off().on('keyup', function(e){
          // Pause game. (p)
          if(e.keyCode == 80){
            if( $('#g').attr('data-paused') == 1 ) { //was paused, now resume
              $('#g').attr('data-paused', '0');
              $('.timer').css('animation-play-state', 'running');
              $('.pause').remove();
            }
            else {
              $('#g').attr('data-paused', '1');
              $('.timer').css('animation-play-state', 'paused');
              $('<div class="pause"></div>').appendTo('body');
            }
          }
          // Abandon game. (ESC)
          if(e.keyCode == 27){
            startScreen('vira');
            // If game was paused
            if( $('#g').attr('data-paused') == 1 ){
              $('#g').attr('data-paused', '0');
              $('.pause').remove();
            }
            $(window).off();
          }
        });
      });
    });
    
  });
