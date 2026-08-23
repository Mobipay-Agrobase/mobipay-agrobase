import 'package:flutter/material.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';

class ScreenNewDetail extends StatelessWidget {
  const ScreenNewDetail({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const CustomAppBar(
        title: "News & Advisory",
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "This is the litle of the news",
                style: TextStyleConstant.quicksandW600(
                  fontSize: 18,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                "March 31, 2024 - 12:03 pm",
                textAlign: TextAlign.justify,
                style: TextStyleConstant.quicksandW400(
                    fontSize: 12, color: ColorConstant.gray6C757D),
              ),
              const SizedBox(height: 10),
              const GInternetImage(
                url:
                    'https://img.freepik.com/free-photo/painting-mountain-lake-with-mountain-background_188544-9126.jpg',
                height: 194,
                width: double.maxFinite,
                borderRadius: 2,
              ),
              const SizedBox(height: 10),
              Html(
                data: contentNews,
                style: {
                  '#': Style(
                    fontSize: FontSize(14),
                    maxLines: 100,
                    textOverflow: TextOverflow.ellipsis,
                  ),
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

const contentNews =
    '''<p>Xây dựng nông thôn mới là “của dân, do dân, phục vụ lợi ích vì dân”. Do đó, người dân thê hiện vai trò và trách nhiệm:</p>
<p>- Tích cực tham gia lao động sản xuất, ứng dụng khoa học – công nghệ nhằm giảm chi phí, tăng năng suất, chất lượng. Hỗ trợ, giúp đỡ nhau phát triển kinh tế gia đình, làm giàu chính đáng. Chấp hành tốt pháp luật của Nhà nước.</p>
<p>- Có ý chí chủ động vươn lên thoát nghèo; đoàn kết, tương trợ, giúp đỡ nhau để cải thiện cuộc sống. Tích cực hưởng ứng các phong trào, các cuộc vận động do Mặt trận và các tổ chức đoàn thể phát động như: ủng hộ giúp đỡ người nghèo, gia đình chính sách, hộ gặp khó khăn, thiên tai,...</p>
<p>- Thực hiện nếp sống văn hóa, ứng xử văn minh; đoàn kết xây dựng đời sống văn hóa tinh thần lành mạnh, phong phú; có ý thức đấu tranh với những hoạt động văn hóa không lành mạnh; giữ gìn và phát huy bản sắc văn hóa dân tộc.</p>
<p>- Thực hiện tốt công tác dân số kế hoạch hóa gia đình, không sinh con thứ 3; không để trẻ em suy dinh dưỡng, không có bạo lực gia đình; tích cực tham gia bảo hiểm y tế.</p>
<p>- Gia đình có con, em trong độ tuổi đi học phải đến trường, không để bỏ học giữa chừng; từng người và gia đình không tham gia các tệ nạn xã hội, vi phạm pháp luật, chấp hành tốt Luật Giao thông khi tham gia giao thông; tích cực tham gia phong trào”Toàn dân tham gia bảo vệ an ninh tổ quốc”.<br>&nbsp;</p>''';
