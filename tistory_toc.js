const CLASS_OF_MAIN_CONTENTS = '.entry-content';

const CONSTANTS = (function () {
  const KEY_OF_H1 = 1;
  const KEY_OF_H2 = 2;
  const KEY_OF_H3 = 3;

  const LEVEL_1 = 1;
  const LEVEL_2 = 2;
  const LEVEL_3 = 3;

  const levelsByH1 = function () {
    return new Map([[KEY_OF_H1, LEVEL_1], [KEY_OF_H2, LEVEL_2], [KEY_OF_H3, LEVEL_3]])
  }

  const levelsByH2 = function () {
    return new Map([[KEY_OF_H2, LEVEL_1], [KEY_OF_H3, LEVEL_2]])
  }

  const levelsByH3 = function () {
    return new Map([[KEY_OF_H3, LEVEL_1]])
  }

  return {
    indexOfH1: KEY_OF_H1,
    indexOfH2: KEY_OF_H2,
    indexOfH3: KEY_OF_H3,
    levelsByH1: levelsByH1(),
    levelsByH2: levelsByH2(),
    levelsByH3: levelsByH3(),
  }
})();

const TOC_CARD = (function () {
  const TocCardController = function () {

    const tocCardService = new TocCardService();

    const initTocElementsCard = function () {
      tocCardService.initTocElementsCard();
    }

    const giveIdToHTags = function () {
      tocCardService.giveIdToHTags();
    }

    const registerHTagsOnTocCard = function () {
      const levelMap = tocCardService.getLevelsByHighestTag();

      tocCardService.registerTagsOnToc(levelMap);
    }

    const init = function () {
      const existsHTags = tocCardService.checkExistenceOfHTags();
      if (existsHTags) {
        initTocElementsCard();
        giveIdToHTags();
        registerHTagsOnTocCard();
      }
    };

    const onscroll = function () {
      const tocTag = tocCardService.findCurrentHTag();

      tocCardService.markCurrentHTag(tocTag);
      tocCardService.scrollToMainTocTag(tocTag);
      tocCardService.detectTocCardPosition();
    }

    return {
      init: init,
      onscroll: onscroll,
    };
  };

  const TocCardService = function () {
    const tocElementsCard = document.querySelector('#toc-elements');
    let hTags;

    const checkExistenceOfHTags = function () {
      const mainContents = document.querySelector(CLASS_OF_MAIN_CONTENTS);
      if (mainContents == null) {
        return false;
      }

      hTags = mainContents.querySelectorAll('h1, h2, h3');
      return hTags.length != 0;
    }

    const initTocElementsCard = function () {
      tocElementsCard.classList.add('toc-app-common', 'items', 'toc-app-basic');
    }

    const getLevelsByHighestTag = function () {
      const highestHTagName = findHighestHTagName();

      if ('H1'.match(highestHTagName)) {
        return CONSTANTS.levelsByH1;
      }

      if ('H2'.match(highestHTagName)) {
        return CONSTANTS.levelsByH2;
      }

      return CONSTANTS.levelsByH3;
    }

    const findHighestHTagName = function () {
      const highestTag = Array.prototype.slice.call(hTags).reduce((pre, cur) => {
        const tagNumOfPre = Number(pre.tagName.slice(-1));
        const tagNumOfCur = Number(cur.tagName.slice(-1));

        return (tagNumOfPre < tagNumOfCur) ? pre : cur;
      });

      return highestTag.tagName;
    }

    const registerTagsOnToc = function (levelMap) {
      hTags.forEach((hTag, indexOfHTag) => {
        let hTagItem;

        levelMap.forEach((level, key) => {
          if (hTag.matches(`h${key}`)) {
            hTagItem = createTagItemByLevel(level, hTag, indexOfHTag);
          }
        })

        tocElementsCard.appendChild(hTagItem);
      });
    }

    const createTagItemByLevel = function (level = CONSTANTS.NUM_OF_H1, hTag, indexOfHTag) {
      const basicItem = createBasicItemBy(hTag, indexOfHTag);
      appendScrollEventsOn(basicItem, indexOfHTag);

      basicItem.classList.add(`toc-level-${level}`);

      return basicItem;
    }

    const createBasicItemBy = function (hTag, indexOfHTag) {
      const basicItem = document.createElement('a');

      basicItem.innerHTML += hTag.innerText;
      basicItem.id = `toc-${indexOfHTag}`;
      basicItem.classList = 'toc-common';

      return basicItem;
    }

    const generateIdOfHTag = function (indexOfHTag) {
      return 'h-tag-' + indexOfHTag;
    }

    const appendScrollEventsOn = function (basicItem, indexOfHTag) {
      const target = document.querySelector('#' + generateIdOfHTag(indexOfHTag));
      basicItem.addEventListener('click', () => window.scrollTo({
        top: target.offsetTop - 10,
        behavior: 'smooth'
      }));
    }

    const giveIdToHTags = function () {
      hTags.forEach((hTag, indexOfHTag) => {
        hTag.id = generateIdOfHTag(indexOfHTag);
      });
    }

    const findCurrentHTag = function () {
      const currentHTag = findCurrentMainHTag();
      return findTocTagCorrespondingToHTag(currentHTag);
    }

    const findCurrentMainHTag = function () {
      const headArea = document.querySelector('.area_head');
      const headAreaHeight = headArea != null ? headArea.offsetHeight : 0;
      const middleHeight = window.scrollY + (window.innerHeight / 2) - headAreaHeight;

      return Array.prototype.slice.call(hTags).reduce((pre, cur) => {
        if (middleHeight < pre.offsetTop && middleHeight < cur.offsetTop) {
          return pre;
        }

        if (pre.offsetTop < middleHeight && middleHeight <= cur.offsetTop) {
          return pre;
        }

        return cur;
      });
    }

    const findTocTagCorrespondingToHTag = function (currentHTag) {
      const indexOfHTag = parseIndexOfTag(currentHTag);

      return document.querySelector(`#toc-${indexOfHTag}`);
    }

    const parseIndexOfTag = function (hTag) {
      const tokens = hTag.id.split('-');
      return Number(tokens[tokens.length - 1]);
    }

    const markCurrentHTag = function (tocTag) {
      removeAllClassOnTocTags('toc-active');
      tocTag.classList.add('toc-active');
      markParentHTagOf(tocTag);
    }

    const removeAllClassOnTocTags = function (className) {
      Array.prototype.slice.call(tocElementsCard.children).forEach(child => {
        child.classList.remove(className);
      });
    }

    const markParentHTagOf = function (tocTag) {
      const indexOfTocTag = parseIndexOfTag(tocTag);
      const levelOfBaseTocTag = findLevelOfTocTag(tocTag);

      removeAllClassOnTocTags('toc-parent-active');
      compareLevelAndMark(levelOfBaseTocTag, indexOfTocTag);
    }

    const compareLevelAndMark = function (levelOfBaseTocTag, indexOfCurrentTocTag) {
      if (levelOfBaseTocTag <= 1 || indexOfCurrentTocTag < 0) {
        return;
      }

      const currentTocTag = document.querySelector(`#toc-${indexOfCurrentTocTag}`);
      const levelOfCurrentTocTag = findLevelOfTocTag(currentTocTag);

      if (levelOfBaseTocTag <= levelOfCurrentTocTag) {
        return compareLevelAndMark(levelOfBaseTocTag, indexOfCurrentTocTag - 1);
      }

      currentTocTag.classList.add('toc-parent-active')
      compareLevelAndMark(levelOfBaseTocTag - 1, indexOfCurrentTocTag - 1);
    }

    const findLevelOfTocTag = function (tocTag) {
      const classes = tocTag.classList;
      if (classes.contains('toc-level-3')) {
        return 3;
      }

      if (classes.contains('toc-level-2')) {
        return 2;
      }

      return 1;
    }

    const scrollToMainTocTag = function (tocTag) {
      tocElementsCard.scroll({
        top: tocTag.offsetTop - (tocTag.offsetParent.offsetHeight * 0.3),
        behavior: 'smooth'
      });
    }

    const detectTocCardPosition = function () {
      const currentScrollTop = document.documentElement.scrollTop;

      const footer = document.querySelector('#mEtc');
      const footerTop = footer != null ? footer.offsetTop : Number.MAX_VALUE;
      const elementsCardBottom = currentScrollTop + tocElementsCard.offsetHeight;

      tocElementsCard.classList.remove('toc-app-basic', 'toc-app-bottom');

      if (elementsCardBottom >= footerTop) {
        tocElementsCard.classList.add('toc-app-bottom');
        return;
      }

      tocElementsCard.classList.add('toc-app-basic');
    }

    return {
      checkExistenceOfHTags: checkExistenceOfHTags,
      initTocElementsCard: initTocElementsCard,
      getLevelsByHighestTag: getLevelsByHighestTag,
      registerTagsOnToc: registerTagsOnToc,
      giveIdToHTags: giveIdToHTags,
      findCurrentHTag: findCurrentHTag,
      markCurrentHTag: markCurrentHTag,
      scrollToMainTocTag: scrollToMainTocTag,
      detectTocCardPosition: detectTocCardPosition
    }
  };

  const tocCardController = new TocCardController();

  const init = function () {
    tocCardController.init();
  };

  const onscroll = function () {
    tocCardController.onscroll();
  }

  return {
    init: init,
    onscroll: onscroll,
  }
})();

TOC_CARD.init();

window.onscroll = function () {
  TOC_CARD.onscroll();
}