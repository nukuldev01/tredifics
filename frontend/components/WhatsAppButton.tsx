"use client";
import { whatsappUrl } from "@/lib/brand";

export default function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#25d366] text-white shadow-lg hover:scale-105 transition-transform"
    >
      <svg
        viewBox="0 0 32 32"
        width="26"
        height="26"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.04 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.756 2.722.756.346 0 1.146-.144 1.39-.302.243-.156.51-.402.589-.674.058-.215.087-.444.087-.673 0-.473-.215-.673-.643-.831-.43-.158-1.6-.598-1.6-1.49z" />
        <path d="M16 0C7.163 0 0 7.163 0 16c0 2.847.748 5.521 2.067 7.851L0 32l8.29-2.116A15.93 15.93 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.6c-2.5 0-4.835-.69-6.83-1.89l-.49-.29-5.05 1.29 1.31-4.92-.32-.5A13.5 13.5 0 0 1 2.4 16C2.4 8.49 8.49 2.4 16 2.4S29.6 8.49 29.6 16 23.51 29.6 16 29.6z" />
      </svg>
    </a>
  );
}
