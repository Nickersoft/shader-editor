import {
  I as e,
  M as t,
  P as n,
  St as r,
  Z as i,
  _t as a,
  gt as o,
  nt as s,
  rt as c,
  tt as l,
} from "../chunks/DjA5qdfU.js";
import { i as u, n as d, r as f } from "../chunks/BCPDeFvK.js";
import "../chunks/BSf_45ga.js";
var p = {
  get data() {
    return u.data;
  },
  get error() {
    return u.error;
  },
  get form() {
    return u.form;
  },
  get params() {
    return u.params;
  },
  get route() {
    return u.route;
  },
  get state() {
    return u.state;
  },
  get status() {
    return u.status;
  },
  get url() {
    return u.url;
  },
};
(Object.defineProperty(
  {
    get from() {
      return f.current ? f.current.from : null;
    },
    get to() {
      return f.current ? f.current.to : null;
    },
    get type() {
      return f.current ? f.current.type : null;
    },
    get willUnload() {
      return f.current ? f.current.willUnload : null;
    },
    get delta() {
      return f.current ? f.current.delta : null;
    },
    get complete() {
      return f.current ? f.current.complete : null;
    },
  },
  `current`,
  {
    get() {
      throw Error(`Replace navigating.current.<prop> with navigating.<prop>`);
    },
  },
),
  d.updated.check);
var m = p,
  h = e(`<h1> </h1> <p> </p>`, 1);
function g(e, u) {
  a(u, !0);
  var d = h(),
    f = s(d),
    p = l(f, !0);
  r(f);
  var g = c(f, 2),
    _ = l(g, !0);
  (r(g),
    i(() => {
      (t(p, m.status), t(_, m.error?.message));
    }),
    n(e, d),
    o());
}
export { g as component };
