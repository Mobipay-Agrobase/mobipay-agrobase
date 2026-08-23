
import 'package:http/http.dart' as http;
import 'middleware.dart';

class GroupMiddleware {

  List<Middleware> middlewares=[];

  GroupMiddleware(this.middlewares);

  bool next(http.Response response){
    for(Middleware middleware in middlewares){
      if(!middleware.next(response)){
        return false;
      }
    }
    return true;
  }
}