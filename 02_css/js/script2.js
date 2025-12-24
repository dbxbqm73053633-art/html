$(function(){

$(".wrap").css({"margin-bottom":50})

$("li").css({"list-style":"none","box-sizing":"border-box","justify-content":"center"})
$("ul").css({"border":"3px solid #000","width":880,"height":200,
    "display":"flex","align-items":"center","gap":20,})
$("ul .aa").css({"width":200,"height":180,"border":"1px solid #000","background":"red"})
$("ul .bb").css({"width":200,"height":180,"border":"1px solid #000","background":"darkgoldenrod"})
$("ul .cc").css({"width":200,"height":180,"border":"1px solid #000","background":"yellow"})
$("ul .dd").css({"width":200,"height":180,"border":"1px solid #000","background":"green"})

// 숨김 버튼을 클릭하면 li:first-chid 숨김
// 별명을 지을땐
// class = "별명"
// id="별명" -> 중복해서 사용을 안할때
$("#btn1").click(function(){
    // 숨기기
    $("ul .aa").hide()

})
// 보이기 버튼을 클릭하면 빨강박스를 보이게
$("#btn2").click(function(){
    // 보이기
    $("ul .aa").show()

    // 토글(보이기/숨김) 버튼을 클릭하면 노랑색 박스을 숨김/보이기
})

$("#btn3").click(function(){
    // 숨김/보이기
    $("ul .cc").toggle()

})
// 네번째 100X100 버튼을 클릭하면 박스 조절
$("#btn4").click(function(){
    // 100X100박스 조절
    $("ul .dd").width(100)
    $("ul .dd").height(100)
})

$("#btn5").click(function(){
    // 100X100박스 조절
    $("ul .dd").width(200)
    $("ul .dd").height(180)
})
})