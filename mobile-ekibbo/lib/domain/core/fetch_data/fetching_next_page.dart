import 'fetching_data.dart';
import 'models/base_nextpage_model.dart';

class FetchingNextPage<T> extends FetchingData<T> {
  int totalPage = 1;
  int currentPage = 0;

  @override
  initFetch() async {
    if (datas != null) return;
    if (isFetching) return;
    isFetching = true;
    final res = await getApiNextPage();
    if (res == null) return;
    isFetching = false;
    datas = res.datas;
    totalPage = res.totalPage;
  }

  fetchNextPage() async {
    if (currentPage > totalPage) return;
    if (isFetching) return;
    isFetching = true;
    final res = await getApiNextPage();
    if (res == null) return;
    isFetching = false;
    datas!.addAll(res.datas);
  }

  @override
  clear() {
    currentPage = 0;
    totalPage = 1;
    super.clear();
  }

  bool get isNextPage => currentPage <= totalPage;

  Future<MBaseNextPage<T>?> getApiNextPage() async {
    return null;
  }
}
