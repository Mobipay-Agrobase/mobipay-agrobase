part of AppProvider;

class AppSearchFarmer {
  bool isFetching = false;
  bool isInit = false;
  int currentPage = 1;
  int totalPage = 1;
  String searchParam = '';
  int cooperativeId = 0;
  int hasData = 0;

  final List<FarmerModel> farmers = [];

  setCooperative(int cooperativeId, int hasData) {
    this.cooperativeId = cooperativeId;
    this.hasData = hasData;
    isInit = false;
    searchParam = '';
    currentPage = 1;
    totalPage = 1;
    farmers.clear();
  }

  resetData() {
    currentPage = 1;
    totalPage = 1;
    searchParam = '';
    farmers.clear();
    isInit = false;
    cooperativeId = 0;
    hasData = 0;
  }

  searchFarmer(String param) async {
    currentPage = 1;
    totalPage = 1;
    searchParam = param;
    farmers.clear();
    await fetchNextPage();
  }

  fetchInit() async {
    if (isInit) return;
    await fetchNextPage();
    isInit = true;
  }

  fetchNextPage() async {
    if (isFetching) return;
    if (currentPage > totalPage) return;
    try {
      isFetching = true;
      DialogHelper.showLoading();
      final res = await ApiProvider.instance.apiFarmer.searchFarmerDistribution(
          cooperativeId, '', '', searchParam, 20, hasData, currentPage);
      isFetching = false;
      DialogHelper.hideLoading();
      if (res == null) {
        throw const FormatException('response null');
      }
      if (res.data == null) {
        throw const FormatException('data null');
      }
      if (res.data!.farmerData == null) {
        throw const FormatException('farmerData null');
      }
      final farmerData = res.data!.farmerData!;
      totalPage = farmerData.lastPage ?? totalPage;
      currentPage++;
      farmers.addAll(farmerData.data ?? []);
    } catch (e) {
      isFetching = false;
      DialogHelper.hideLoading();
      debugPrint("AppSearchFarmer fetchNextPage error: $e");
    }
  }
}
