"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Виден ли элемент в области просмотра.
 *
 * Нужен, чтобы гасить рендер three.js за пределами экрана. Canvas от
 * react-three-fiber с `frameloop="always"` крутит requestAnimationFrame
 * бесконечно — в том числе когда сцена давно уехала вверх и её никто не видит.
 * На главной такая сцена одна, на страницах услуг тоже, но платит за них
 * основной поток: Lighthouse показывал 20 длительных задач и 31,5 с работы
 * в основном потоке при норме TBT до 200 мс.
 *
 * `rootMargin` даёт запас в пол-экрана, чтобы сцена успела ожить до того, как
 * пользователь до неё домотает, и переключение не было заметным.
 */
export function useInView<T extends HTMLElement>(rootMargin = "50% 0px") {
  const ref = useRef<T>(null);
  // Стартуем с true: до первого срабатывания наблюдателя сцена ведёт себя
  // как раньше, а первый экран всегда виден.
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver !== "function") return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin },
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
