if (!MenuManager)
    MenuManager = function () {
        var me = this;
        var collections = [];
        var indexForNonStandAlone = -1;
        var eventInitializeStatus = false;

        function onClick() {
            for (var i in collections) {
                collections[i].hide();
            }
        };

        $.extend(this, {

            setIndexForNonStandAlone: function (v) {
                indexForNonStandAlone = v;
            },

            getIndexForNonStandAlone: function () {
                return indexForNonStandAlone;
            },

            add: function (menu) {
                return collections.push(menu);
            },

            get: function (idx) {
                return collections[idx];
            },

            hide: function () {
                onClick();
            },

            getCount: function () {
                return collections.length;
            },

            onDocumentClick: function () {
                $(document).off("click", onClick);
                $(document).one("click", onClick);

            },

            offDocumentClick: function () {
                $(document).off("click", onClick);
            },

            getEventInitializeStatus: function () {
                return eventInitializeStatus;
            },

            initializeEvent: function () {
                eventInitializeStatus = true;

                aui.core.Events.onWindowClick.subscribe(function (args) {
                    onClick();
                });
            }
        });
        return this;
    } ();

Menu = function (options) {
    var me = this;
    var opts = $.extend(true, {
        className: "aui-ui-Menu",
        parent: null,
        data: null, //[{value: "", text: "", children: [{value: "", text: ""}, dom: null]}]
        width: "auto",
        standAlone: true,
        showMode: "default",
        duration: 0
    }, options);

    /* events */
    this.onClick = new $.customEvent("onClick", this);
    this.onHide = new $.customEvent("onHide", this);
    this.onMouseenter = new $.customEvent("onMouseenter", this);
    this.onMouseleave = new $.customEvent("onMouseleave", this);

    /* private property */
    var data = [],
          index = 0,
          parent = opts.parent,
          $container = null,
          menu = null,
          iFrame = null,
          subMenus = [],
          value = null,
          iconSize = 14,
          fixedWidth = 0,
          st = null,
          $dom = null;
    /* private methods */
    var _renderItem = function (d) {
        $dom = (d.dom ? $(d.dom) : $("<div/>").text(d.text));

        var $item = $("<div/>")
                .appendTo($(menu))
                .append($dom)
                .addClass("item collapse")
                .data("value", d.value)
                .on("click", onClick)
                .on("mouseenter", onItemMouseenter)
                .on("mouseleave", onItemMouseleave);
        if (d.children) {
            $item.append($("<div/>").addClass("icon").css({ "width": iconSize, "height": iconSize }));
            fixedWidth = iconSize + 2 /* border width*/ + 10 /* margin right */;
        }
        $dom.addClass("dom").css({ "width": "auto", "max-width": $(document.body).width() });

        return $item[0];
    };
    var _add = function (d) {
        var p = _renderItem(d);
        if (d.children) {
            var subM = new Menu({ standAlone: true, data: d.children, parent: p });
            subM.onClick.subscribe(function () {
                me.hide();
                me.onClick.fire(this.getValue());
            });
            subM.onMouseleave.subscribe(function () {
                if (opts.duration) {
                    clearTimeout(st);
                    st = setTimeout(function () {
                        me.hide();
                        st = null;
                    }, opts.duration);
                }
                me.onMouseenter.fire();
            });
            subMenus.push(subM);
        }
    };
    var _rebuiltMenu = function () {
        if (!opts.standAlone) {
            $container = MenuManager.get(index).get$container();
            if ($container.children()[0] != menu) {
                _destroyMenu();
                $container.append($(menu));
            }
        }
        $(iFrame).appendTo($container);
    };
    var _destroyMenu = function () {
        if (!opts.standAlone && $container instanceof jQuery) {
            var m = $container.children().clone(true);
            $container.children().detach();
            menu = menu || m[0];
        }
    };
    var _initailize = function () {
        data = opts.data || [];

        iFrame = $("<iframe/>").addClass("menu-frame");

        menu = $("<div/>")
            .width(opts.width)
            .on("mouseleave", onMouseleave)
            .on("mouseenter", onMouseenter)[0];

        if (opts.standAlone) {
            createContainer();
            $(menu).appendTo($container);
        } else {
            index = MenuManager.getIndexForNonStandAlone();
            if (index < 0) {
                createContainer();
                MenuManager.setIndexForNonStandAlone(index);
            }
        }
        function createContainer() {
            index = MenuManager.getCount();
            $container = $("<div/>")
                        .attr("id", "Menu" + index)
                        .addClass(opts.className)
                        .hide()
                        .appendTo(document.body);

            MenuManager.add(me);
        }
        for (var i in data) {
            _add(data[i]);
        }
    } ();
    function onMouseleave(e) {

        e.preventDefault();
        e.stopPropagation();

        if (opts.duration) {
            clearTimeout(st);
            st = setTimeout(function () {
                me.hide();
                st = null;
            }, opts.duration);
        }
        me.onMouseleave.fire();
    };
    function onMouseenter(e) {

        e.preventDefault();
        e.stopPropagation();

        if (st) {
            clearTimeout(st);
        }
        me.onMouseenter.fire();
    };
    function onClick(e) {

        e.preventDefault();
        e.stopPropagation();

        var v = $(this).data("value");
        me.setValue(v);
        me.hide();
        me.onClick.fire(v);
    };
    function onItemMouseenter(e) {

        for (var i in subMenus) {
            var m = subMenus[i];
            if (m.getParent() == this) {

                m.show(); // need to show then get width / height.

                var $this = $(this),
                      pos = $this.offset();

                if (pos.left + $this.width() + m.getWidth() > $(document.body).width()) {
                    pos.right = $this.width();
                    pos.left = "";
                } else {
                    pos.left = pos.left + $this.width();
                }

                if (pos.top + $this.height() + m.getHeight() > $(document.body).height()) {
                    pos.bottom = 0;
                    pos.top = "";
                }
                m.position(pos);
            } else {
                m.hide();
            }
        }
        $(this).toggleClass("collapse").toggleClass("expand");
        $(this).addClass("focus");
        //me.focus($(this).data("value"));
    };
    function onItemMouseleave(e) {
        $(this).toggleClass("collapse").toggleClass("expand");
        me.unfocus();
    };

    if (!MenuManager.getEventInitializeStatus()) {
        MenuManager.initializeEvent();
    }

    /* public methods */
    $.extend(this, {

        render: function (node) {

        },

        unrender: function () {
            $container.detach();
        },

        get$container: function () {
            return $container;
        },

        getParent: function () {
            return parent;
        },

        setWidth: function (w) {
            $(menu).css({ "width": w });
            $.each($(menu).children(), function () {
                $(this).children(":first").css({ "width": w - fixedWidth });
            });
        },

        getWidth: function () {
            return parseFloat($(menu).css("width"));
        },

        setHeight: function (h) {
            $(menu).css({ "height": h });
        },

        getHeight: function () {
            return parseFloat($(menu).css("height"));
        },

        getCount: function () {
            return data.length;
        },

        getValue: function () {
            return value;
        },

        setValue: function (v) {
            value = v;
            $.each($(menu).children(), function () {
                var $th = $(this);
                if ($th.data("value") == v) {
                    $th.addClass("focus");
                    return false;
                }
            });
        },

        clear: function () {
            $(menu).html("")
            data.length = 0;
        },

        remove: function (v) {
            if (!menu) return;
            data = $.grep(data, function (n) {
                return n.value != v;
            });
            $.each($(menu).children(), function () {
                var $th = $(this);
                if ($th.data("value") == v) {
                    $th.detach();
                    return false;
                }
            });
        },

        add: function (d) {
            data.push(d);
            _add(d);
        },

        setEnable: function (b, v) {
            $.each($(menu).children(), function () {
                var $th = $(this);
                if ($th.data("value") == v) {
                    $th[b ? "removeClass" : "addClass"]("disable").attr("disabled", b ? "disabled" : "");
                    return false;
                } else if (v == undefined) {
                    $th[b ? "removeClass" : "addClass"]("disable").attr("disabled", b ? "disabled" : "");
                }
            });
        },

        fucusNext: function () {
            var $menu = $(menu), $current = $menu.find(".focus"), $next;
            if ($current.length) {
                $current.removeClass("focus");
                $next = $current.next();
            }
            if (!$next || !$next.length) {
                $next = $menu.find(".item:first");
            }
            $next.addClass("focus");
        },

        fucusPrev: function () {
            var $menu = $(menu), $current = $menu.find(".focus"), $next;
            if ($current.length) {
                $current.removeClass("focus");
                $next = $current.prev();
            }
            if (!$next || !$next.length) {
                $next = $menu.find(".item:last");
            }
            $next.addClass("focus");
        },

        focus: function (v) {
            $.each($(menu).children(), function () {
                var $th = $(this);
                if ($th.data("value") == v) {
                    $th.addClass("focus");
                    return false;
                }
            });
        },

        unfocus: function (v) {
            $.each($(menu).children(), function () {
                var $th = $(this);
                if ($th.data("value") == v) {
                    $th.removeClass("focus");
                    return false;
                } else if (v == undefined) {
                    $th.removeClass("focus");
                }
            });
        },

        getFocusData: function () {
            return $(menu).children(".focus").data("value");
        },

        showItem: function (v) {
            $.each($(menu).children(), function () {
                var $th = $(this);
                if ($th.data("value") == v) {
                    $th.show();
                    return false;
                }
            });
        },

        hideItem: function (v) {
            $.each($(menu).children(), function () {
                var $th = $(this);
                if ($th.data("value") == v) {
                    $th.hide();
                    return false;
                }
            });
        },

        setMaxWidth: function () {
            $dom.css({ "max-width": $(document.body).width() });
            for (var i in subMenus) {
                subMenus[i].setMaxWidth();
            }
        },

        setMaxHeight: function () {
            $(menu).css({ "max-height": $(document.body).height() });
        },

        setMinWidth: function (w) {
            $(menu).css({ "min-width": w - fixedWidth });
        },

        show: function (pos) {
            /// <summary>
            /// show menu. 
            /// set position if  has "pos" parameter, 
            /// otherwise detect to parent position and set it near by. 
            /// </summary>
            /// <param name="pos">object</param>
            me.hide();
            _rebuiltMenu();
            //$container.slideDown();

            $container.removeClass();
            $container.addClass(opts.className)

            $container.show();
            me.refresh(pos);
            MenuManager.onDocumentClick();
        },

        hide: function () {
            if ($container) {
                //$container.slideUp();
                $container.hide();
                for (var i in subMenus) {
                    subMenus[i].hide();
                }
            }
            me.onHide.fire();
        },

        refresh: function (pos) {
            me.setMaxWidth();
            me.setMaxHeight();
            if (pos) {
                me.position(pos);
            } else if (parent) {
                var pos = $(parent).offset();
                me.position({ top: pos.top + $(parent).height(), left: pos.left, right: "" });
            }
        },

        position: function (pos) {
            if (pos) {
                if (!$container) {
                    _rebuiltMenu();
                }
                if (pos.left < 0) pos.left = 0;
                if (pos.top < 0) pos.top = 0;
                if (($.isNumeric(pos.left) ? pos.left : 0) + me.getWidth() > $(document.body).width()) {
                    pos.left = "";
                    pos.right = 0;
                }

                if (($.isNumeric(pos.top) ? pos.top : 0) + me.getHeight() > $(document.body).height()) {
                    pos.top = "";
                    pos.bottom = 0;
                }
                $container.css(pos);
            }
        }
    });
}
