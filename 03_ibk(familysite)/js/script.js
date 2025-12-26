$(function(){
// $("선택자"), 실행할 함수이름

$(".family2 .family_list").hide()
$(".family .family_list").hide()

// 1번째 패밀리 버튼을 클릭하면 fmailylist가 보임 / list 안보임
$(".family button").click(function(){
    $(".family .family_list").toggle()
})

// 2번째 패밀리 버튼을 클릭하면 fmailylist가 보임 / list 안보임
$(".family2 button").click(function(){
    $(".family2 .family_list").toggle()
})

})