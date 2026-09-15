const {
  useState,
  useEffect,
  useRef
} = React;
const uid = () => Math.random().toString(36).slice(2, 10);
const roll20 = () => Math.floor(Math.random() * 20) + 1;
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Ordered by hue around the color wheel (Brown grouped with Orange as its
// dark/desaturated cousin; Black and White are the achromatic outliers at
// the end, dark to light).
const ENEMY_COLORS = [{
  name: "Red",
  hex: "#ef4444"
}, {
  name: "Orange",
  hex: "#f97316"
}, {
  name: "Brown",
  hex: "#92400e"
}, {
  name: "Yellow",
  hex: "#eab308"
}, {
  name: "Light Green",
  hex: "#a3e635"
}, {
  name: "Green",
  hex: "#22c55e"
}, {
  name: "Light Blue",
  hex: "#7dd3fc"
}, {
  name: "Blue",
  hex: "#3b82f6"
}, {
  name: "Purple",
  hex: "#a855f7"
}, {
  name: "Black",
  hex: "#3f3f46"
}, {
  name: "White",
  hex: "#f8fafc"
}];
const NPC_COLOR = "#a1a1aa";
const LOGO_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AABMyklEQVR42o2dd5wkVdX3v+feqs4zszmy7AK7wJKjBFFAAXMAEfVRBCNKzoiA4CMPmBVQwAdEQTKSFBMCggrsEndhSZtzmp08HavuPe8fVT3Tszvr8+7n09s91dXdVfeee8Lv/M65Agij/zPpewawgOmAMCoUct77rKqKiHhAsqoGEK9qfag56zULICIOENXAqmqIxC7QIFQQB47kJG8kjgBVVSMiCjgBRVBVQq9BEKhahcCKVCNQqxoC4kSiEPCqgUIm/Q5HcvEecE4kEhFnRGKvmnHeFwAVkciqZmMQgYYxpqGqVlUDQAFRCNLxUFUNjEjNOVexIjVNPudja8uFarW/Cxrp51z6rNsZ26Hj8v87AeMhqJfIOpfPZbwPfUYDVYLAa8ZZzQcaBApiVHNiNK+KBbAW69VkBbyINMAZryYjuFhVqoBaxXjBiUikyWQaizXpHKkqgWKNJAcEUBwKGLVY46WOqnjIYkEcDQdiIEzP9x6cgcCJlBQC431VRRpG1SomTG7Zq2KsIM7jGoLJiWjRgVEvZRVfTQUrVu/LKtJnjKmpc/0uCAbL5XKVZBJiksnf3gQMTcJoEyBbSb4dB7ZRKmWcc7nAuaIJtOSMLQXi2y2mIzAahgF5Ec15JRN7g3METjWDJ1AhJBGnSMGKkAEUpQY0DAQenIjE3oMx+OR8zQJWMUZARbTuVK1JrktJjot67zQdbMVEyXibQA0BHodBRDWnSns6f5EKkXoakhzIDEm7EIDYdPUYIDCgBmqBSl0wMaKVWHUwFu1W2BB732eN6a97vyWs18uDJPfVMhHb/dcc6K0l35AsPdveThjHZJ3L5nLWdyBmrMFPCkIzPjQ61nkZP9jQXL1hsla0PZ+lUMp4LWQohoFkrRDgMR4MiIhiVJOlK6CBIR6SBwXvFRHxBhxKqEoIgoDDgTYFRBFBBJW6kky0B5fqrUAVREQMxnvFq5JLJyk2aly6sporyiTiKqqQAc0YRDQRkihGXQUXD6rXKq4eqw5kxfTl1Q4GsMEJvQ3Rbu/cWuf9Bm/t5qBer5RhMJ2I7a6G1gmQlsG3QFgqETqXzwaBK0rsx2CCnXOhnxxaHddXNR3Vuo6bOpape05lyn4zfHGPqZrfcQyF8TnNFLNksgYxiqQaUfEIHiVOjACkSiUGiUBjQbyCEyQW0RglRokN6hBxkiiSCCWSRC69EfEWcaK+IYIXcII6o6IGNBC8QZxRvFXvRZAAnOC9FfGiaIBiBTUYJ6rJ+kPE4L2XhlcdxOtmIl1DI17gB91CP1B+g8qWHuLBAqaax25uoCsa+KUKS/C+20fRlir0AfUWm6CjTcAIYwvYUolsHOeK1rq2UOz4wDAll/G7DdaZXo9kh3ft4md96mCdcMxuvm3uRA0pqkEQGkCUznnz2bWYJp8uTEeyBpxCLMmxKD0WyfCxmJa/0/ciwFuIbfodJn3fJA8nyfvOgNrkdWTAm+S1pg9nNVmHBjTQ5P10OFSaZlyT14bE5hpAiXzEa1rxf/E91d9rZ/VtqWwuiV1jvayqGr8U799yquuJws0VKn3p3bnRJiBIny0QjAXrOzCNRr4QBK4YqJ8UhnZuaJnT2csOh+6mu511rJv14X18e2GcBjjo3iAsXC0sWmtY0Qmb+4XBOtRjBRW8B01/Vn1qdDQ5NuJ10yylf6OgXlMtKslnW85BW8+VluNbnYMgzfOax8UMHdP0WHItkowzICqgqjkxFLFMkJBdyLMvRT1ASjpWc4DQqTX9nd9Uv561vZskWjuGYEUVt9Spec1rvESiaEMZ+ltEcoQXlG1OwDiwURthHOezmYzPipMdClndM/a6R73BPpcc72d94/1u+tgJGvhe4Q8vCw+8ZJm31LC2GxpRqxmX1F1pMfq6HZ9Lmku+1UfTIYcHwAyPy9BXDE2gDP/d9D11W49vxGe365i0XrRs/Q3JPWQwzJIcR2q7fk4m6dGMAQ30TT/gL5ZlA49Lz/LxhBuquFfVy5sx7u0gitb0Q3XrSRAg31RBY8diGw2y1mbbRHxHybJXrHJIGOjev/ia3+cTR7gOGvDYs0Z/8Fggzy8xODXkMxBaTcR7q1tUhqV/lHv7//onqlQaTXdChz4sqdBLIqhDwl8yBhFJAgk0MeEjhjK9EpX/fDE6cuaGThMhEqWqjqyDD+pYLtcd9SDGapVIL2JZz/+aDavG+XBFFbfc4RcakRcHGo1OhidBaVE/ZizYOCbwPp8JNG4r5WQXROfkAp19+9l+vyMPdm2VHvRbvwvkxr9aMTYgFzSo1GpUqxAHlmw2h/ceTa9c0gHYjshv925bB0wVCiHccrxnrFHcoEGqAVQDqAdQtVCz0AjQ2JLRkEt6NrHU1wkx+NaBa3mlLSPa8mstq1SGJju5DxARjDHUKhVi7wmAMJvjD0EvT8e9cg27yOl+qr9e54w3iNws63W8hEEZnIOudrLaT31TizXEjoN8fhziM1jnCPPGdAQZMz0bslclMu+69Ux3yLGHuzHdm4WTfhTI3f+0dJQMlWqF9vYO3v3udzN3990pl8ts6eoik8mMvIFWbdIyuLK9IESTCCowqTcgSm8FdhzjOe9Ix9ysMDdvmJsLmRsGzDUhc22WuSbLXFtkfrnCLeVe8sZgRbCjTreM+vsyQsxbVhmSrCj1VCoVdtppFgcddDBjx41j0+aNaK1BkM3wsG7Go/I+P1bfy7jCazKQeUMqrqS2FouWfUAcOtcfDXtFBK4Dg0O8x2RcLiNZV2jL69j1W2TWdz7n9v3wEX5cuQc9+WdW/vaqZXyHoae/xje+cRrf/e6VKAGNRgN1jh//5KfcfNMv00lQNF3iTclK1MLWMp+8ZySJdZ2HWgOcS6Qvn4HpHXDDvywHjIFT58BA2WBrTb9Ccc6TBxbWKny5ZwPjA0OM0OvSwMEIeWMIUy/YtUiEbqUaR6wJSRWYJJiIIPzkJz/hlC+eSv9AGRc7Nq5fxxVXXs4/n3masYUC32MVbRqYi/ws/aHuMu51/1qjx8RbQs9Uh/RoJrOORqOcrgICTQMj74vWZ2NbDG2pp9/POnRXf9jpH/JT8HDVXVb+/LJhwljLlp4KF1xwAd///rWcd+HlPPHXh4jimPcd9zGuvvIqBgYG+O1vb6OtrUTs3DZ2bXhtaKL7BIxRqg2IIsjllP2mKYdP9xw0SdmtA3bqUE7/m+W0vwjvm2DYIYCaA6uCimCNwduAL25ezc4Z4Yk5E+hzwtKK49VqzLxag5erdbpcjBWhKAYVxQ1dyfaQmeS1MYbBwUGuvfb7fO2rp3HaGefw4nNPYTNZTvzsydx6y2/50le+yHP//hcd+TzfYQX7a0mO8ZPNeWbG2AtZMmOchBuq4leqs2OK0FtOVoGXUqk0UVVNzntrc/H4Uo69N/fKsXec5z55/DFuzFP/Mnzo6oB8zlKp1pkxYybz5s/jzHMupXPRbVx/GsQb4IvXwdGnfZvPnfAJjj3ufcQuxhiLqo6q75uDX6kr3sNe05RP7uH56O6evccrBaOJhMeJC+4qlrm3W6bn4cljMjR6M2glwFdDinGBi1b3cdOWHt7YZxIzcyFUNfGsvcHFwrKa568DFe4tl5nfqKIIJUkwDy/b2oim0BgR6o06U6dM5fnn5nH+Jd9h3fzbuPlzQv+iLF//Y41jL7yMTxx3HB/+6AcIVKmJsq8r8oTbT72gHzQLOt82lfkZtS81xM23Im/narUtG8AZ732QVzVR6PNhxkzoGZAd3z1X9zhuf98WDQjXPBQQe4MYQxR73nPEEaxYtYkXnrmbRy+37NVu2G9MyHVHW5568u8U29qYMmUqUaMx5DaOXNxKIEpgFOeUd81U7jw15l9nRXzvwzGHzPAUsolaqtZgWbfhb4std7xjmN2hPL1Oue4tyGUNkTcUbcgTfVV+vKmbPUpZHh+IeLSryptxTJ/z4BWLsqs1nN0+hicmzuDRsTtwbFhkUB2KEmoSJwwFHyNsgBDHjhk7zqCnd5CXX3yGW75o2csWObw0lvv3m8xj999Noa2d3Xefy2C9TpuEvGT6uUs2yFjNyhd0crGGnxyKzDEik2Pvc7UEFjFBNutDB2S9b8sHMn5LXSZ/9CA3pzhO7V/+YfSfbyClPDiXjGa+UGBLVy/tmZi2PkE3gFSyrFg3SMf4CRhVKoN9LdI/rGWbseRADfDKZw/x3POVeBgtcbCpX3h+peGpZYb5a4VlvUJPDXwMQQClPFy+sMERhRwH5yybK8o31nSRDQyvlyO+3t8LBtqtMCOw7J/LcnQ+y5Fhnp2NoYDw0WyRD4XtPFYrc9rAOjZpTFEsJjEpabQ3bL+sMfR0bSG0htKY8Sx/eRlzJ7fBxjxjaopv1IldTCGfR0mC8gDLb80mvuym68d0Qvbnfu2MPuO6rTdTnJVxDYp94yl7471a7zVQsW3VOjtMGef3OGov34aD+54zEsXDFyIiLFiwgD123QnXvg8X3hyzcpXy+38NctkbhvPOOIO/P/k06zd1ks1mhtSPoIQGGrFSrikXf8hz7J7KX183LF4vkIF/LTN8/YGAd90Ycvw9ATfMs7y00VCOhEIotBeEbCgIQt3Daa+VqRJy6eoBltVictZgjaE9Y2mziRF+p+G4s6/MVzZ2c9j6DZzYuYmHKoP0e4c1hhhls494b9BGCFTVk2lxgpPI3ZPPZXnrnSX8+7l5nH/uRXzzr/DIvAFeXtvglDdXsPd7jiIQYfHixWTCgFg9eQwLZZCnpUdmUbKH01Esq7OBSIeBGYSNCXVKWVsM7TQTEuSsTh6oyj4H7uL3OfujfnJvl5jL7w2oRIIRg1clEwasWbOGnXbehTNOP5PfPruaW1+LeD6zBxddeTUxITf84Fw+tEeDN9dJguOmNzRYUWaOV357asyZH3C8d6by6+cszywzPPGO5ZJHA15aZan6ZMBzGQjS8FdVcJoEVh7IGNhQ9zzd3eCpvhqBNagIKuCb0AJCKELOGrJiqCm83mhwf3WAf0RVBtRzXv96DrB5/tG+K4faNp6NBlivEfk0fmi6wc7BCQca/vTU0xzy/hM47H0f4Po3N3JfQ9npox/n0vMu5robfsa8+c+TL+RR7wkQKsRM1Ix80E/ULVLnL6a7midY38BvEWPKYeBrgQ80CFxogyAaU49l6j4zGWdLyKsLhTVbIJcRnE99FhFsYLniim9x1lnncfH551FrxIiPeHr+Czz1u1/xwPE9zNzf8vZGx4vLhFLe4BROONDx8886ZoxVqIMNDDtN8MxbZpm3QijlwGTBY8CYIQ9qCJ4ZEskEXM1aw7/76uSNSSZpGzsqeFV86v6GgSV0HlXlxajG/KgKwJdyEwgV3hcUebq0O1+rrOTPrpc2CfCqDFSVfXdz3HpSgfUPZTnxtK9z9DdO5eJzz8dkMtQqZb773cv585/+QKGQxztHAgArVgwvSj8xkezvS0GH2JIzfpoVWR6rBrH32UAEp14zxppCYBiz23TtwMKClYlbWMiSAvZJuG+tpV6rcfXV32XihAlMHD+eNRs2c3Smh7v2LfDYa3leeL7ORccpnQOGbz/oCQPhe59UZkxT/CD85lnLtx+xdFeEtmIirU7BmIBquYzznkKhkOhibVXJyUxIis8VA4vX/xBhp1Gsc45ypUIhn8daQyHFNr0q51XX8VZU5Tu5aUyTDH8qzOXU6lLuijdTkIAffi5glli+8lPHAQH81k3hez+4mZNL1zOhNIbOri00oohCoYA2oZgUj8qqYaXUWEeNORRkOpnCcq2PDdTkY9R41ZwxkThrNfRKJpfR7I4TyIPokg0m1d4jPWRVMDagVCzS19fH4iWLqVYG2GjyXLc8ZlxdefDokE/v6dlvhmf36dAzCB/4meHxV4Sv3BHw1TsC+uuGXFaIvaBiEYT+gQF2nzuXCy+4gEajniChsrVjOHwxvhmqyuhgjoihXm8wduxYTjnlFKIoYmCwjAks3gg+xYt+FnVyTHkJr8dVXnH9zIv7ievCrjsL793V8mnt4P6O2bR3F/lpYwtr8gG+HtG5pRNrLcVicXjwU1RQNYlTeolZLlUZQyCTybY38GHgUaOasaq5wIdqQyWMYs0Vs+QmdmCpw7quREw0hRhHRLCqOFWCIIAwJMDzQqdj3w7L1+YId8/z3PdYwJQJnltPdqzoMnzql/Chn4WoJFLvNXmEoWWgfwBjLWeddRaXXXYZkydPRozhxz/+McViEedcCkM3PZTRMKTR8SUx8MMf/pAvnHwyp556KpdffjnPPvss2UyGTCaDix0dEvKyr3Js7R28V7qIufusPHPJ8ctf1flhY4CPmwyn644skOW84rtptzliSfNMfnjwh+OexPrVxLOGGqiVSWStE4qCjFM1ecH0mVCxxmjGKZliFtNeQKgjPWWwptU11lHhM/WeSKGUE+5a7TjuH47XuuFne4T86kMw1itruzzv3s0QBkoxo0na0RhEoL9/gP3235+nnnyK66+/nkbd8dabS7jwgouZM3s21WoVYxJQr+mqJ48hML/ltabSpxhjKJcrHHvMsZx00udYuOAN9tv3QP7x1NNcd911tHd0MDA4iLGG2AhtxtLrHVuimCN2C6k1lB06M9yy4yyullm8MhBzTGMRd+lGimSIh65o24lvDT4dymaJAWGShpK445oXo0UNMYE2wT6HZENsPlB8DNWGbLWyZUgNtwa30sxviBCr8mof/P6QLAMa8827LJsNHDfX8Y+zY/74muHjNxnaCpZyuUwQhlx44QVc9u0r2LhxM5856bN479lv//0ZGBhk7bp1ZDLhyGhaldTuEsUJjGFFU1swDG9678hmMrz8yivccMMNlMtlFi5cwKSJk7nqu//N+99/LFdccRkPP/wwYWDJZrLUI8+jF+b4SHvAr+6xfLOzxvRoE2e4GZzDDA7l5STP0TT6Ld6BtgRxItKyYqEvtaLtBCaFvgJFswrZAEXUSN1HomHgg9AqUYREcRMOFhhFDTdBtCRQgchBR07ornje9Y86h483fGBiwGf2MTC1yn3PC4t7hdOPUm78R4W5c/fg6quv5uijj2X+C/M5++wzWLz4HQB+/+ADSaYom0WMSSc8yeRbq1SqSRQ9vsNQriqDkVDMKUbApVGtAtZaenp6uPiSC/At1vrVha/wkx9fx42//BXHHXcc//M/17B27RrO/ECBN1c4GMxw+qQJnD7Qzk39fVzjNvICfXRJBGooiv2PiQPZKv1QwwMieYwBDRXNGAhVNWsQ1DiJnPi6EcQkeXF1yjaJjHTFD4+/pikPTRIyf/xazPnvhXf6PHOKhs/MDPjFS45P/DZgw8aQI6ZHbOlucMqpX+aBB37Pu951OE8//Q++/vUvs3jxO7S3t1EqFSmVihSLBYwxQz8WGPDOMzDomTZZ+M1Pp/DxD03i+s8HnH6QpxErAzWPFY+R4ZxaEATk8wVKpRJtpRJtbW3Mnz+Pr5/2ZV59dQEf/fAneOjBhzjx0yfR3VnhXd05VrzVzokvdvLTrk5OMzswU/K8KQPMkSIn2okMqkvZWom6U69DaKlsjeXpMNhnkzRhKIh34FXVGh9L3UjkVKUiorUWT2o7ST2G9GwyMEq5Dt/7sOOQvR2nHOIo5YSrF0d84N8xlYbhnkOK7B3X+PaTUzjk67dz1XeuJAhy/OlPj/HZz57ImjVraGtrI2pEeOdxzuPSC7c2keyBckw2K1x2zjheumsMp35jDxpxyG77Zvnll7M89QnHB3aGgZpSi5VQFJMOkPce7xzOO+I4or2tjTfffIPPfOZTPPnUk3S0j+MH1/yAPb9wM1cszbJPf4NfZnanJwr4cLSIn7CScWS52c7mnnB3DqZIRR2BJtm61uzctoMlQ7B76lEbEepGpOpEnDFG4lhEDQgqfhusfhsXW4cA3NDCQE34+D6OM452RP1wyR8NlUZCTHirLHxpxzxX/7uHK/VD/PA3f+RTH3wvg+Uqt99+Gz/68fc57/zzKeTz1Os1jLUt5CQlDJTBQU+1GvOFE9uZ/+gOXP1fFcYXZ+HW1hlctZL+zipuapYj2g1/PSLmrvcbZpegv+bw6glFh8ZFFayxlCsVxo4ZwznnnsN3rrycO++6g0q1xn997Dj++3cPcum+u/KD7rc5SSbzmq0kJI40DWlEuD6cTQGTmgBpHZoRg9V8x49go4hRlUxqQSKTMmm8GM2SIHSoT9O7rcksbTE2aQLFK4wrwjUfcQQF+O3zlj8tshTzQi7MsKavwuynB3FfvYo7br2J6RMnsGrNeq644lLuuedufvSjn/L9a6/lxptvxHtNJsEIgVWiWOkfiDnsgAx/u3cWv/vBJHYb3EB1w1ji4mTs2/+mHoHra2Ab/VR2yVFfafivsTDv2IDv7J0ho9Bfd1gSRNSIUKlWyGVz3HnXnXzve9/j6v+5ll/fdivfufIyVq/dwI4TJ3P7TbfgLv4yh8bz2dAoUwizlHGc5pay1lc5RDo400xjUCPCVi0tIwdrRDpWPT6JXHwLtRLjvVqRoZgmENlW8FtZAU2DGFgo14Qz3uPZc2dlzVrhqr8acjnB2JC+gUF2nTOb3959P+d/83S6Oru4+967OfHTn2TJ0qXc/Ktb2X33XXn11QWccPwJ3HvvPUyYMB7vHQODjvEdcMM1U/nn/btyzM6O+r+WUB8ICXc9DHnjSbTmqEaGRizQHWOLdexuGarLldJm4buzMjz3nhInTs0yEDmqzoOLmT5tOo/+4RHe97738eJLL7Pvvntz3Q03sfC11/nMZ0/g3vvvo7erl4vPuICbb7+dmTvMoLs8SHuYYwVVvtNYhfeOs+00dqdATT1mlCROq7FMvEdJFZZ6HRJvMD4ksEogiJd0STXdvK0tQUIDSQxvPYJdpyjffI8DDz9+wrC+NyAXGvr6B/nYRz/KI48+xgH7H8jvH3qQc887m1//+lYOOvhQBvv7qdfKZLMZ6o2INWs3cMAB+zFjxmwq1Tpf+dwY5v9lT848aRz6+jLqb6xADLDTu4gXP40bLCMSIFgsCRMu7vHEkxwy0dLog8pq2KNieGCPNh7Zawz7FLOU6w322Xcf5u62O68veouBgUHCTJaoUaVeq7L3fgdwy6//lwsuOpdH//goR7/naB586BGOOupIugcHaDcZ7pRO/u67mSw5vmGmUcdjU9e0lQIylOAfEcSKAJHIEItaDYC3gU0o4dpARyf0tvq51ghRDJ/c2zNlR2XJWsMdL2cJbYOBSo0rrriCX992B2vWbuDss8/krLO+yeBgmYsvvYJPHv8pDn/PkZx++jdYtmwFY8e2c+edv2P2nAMo973A4/ftxq3fn8EOA5sZ/PdC4v4+rDFkps4m21hCzm0iXwgY7Pas3ORY3ZlMQDEj5ALI7Qy5TIAVw0AfDKz2fCLI8q+dx3LNzEk8+ac/M2f/A/jLY3+kWCjw+uuvc+45Z3HEe47iIx/5BOecdzEbN2/mrLNP5+xzz6Kvb5C777qfs846i4FKhch7rpUN4D3fMFPZUwvU2HoVjLIY0v8SYrE0GXImkAZKAt1HXok15XLrVgwoHaLkJK/DQPjpk4bl3SH1SOgdrDB50kRu+MUvOezw9/Kb39zGT37yIzZv3kQhn2fp0sU8+69n2G//Azn88CMAOP+8MykUJ/HC/Ge4/IKpXPLVXSmVe4nmLyK0DUoTA2h4/GCGpe9s5sXXepi/2rC00/L6Ck9YCvmfpxz3vAQ7tjn2L8UcPNayZ4dl2qaQbBiAtWi/kPFwabHIx+bM5Fsbu7jyu1fxxDPPsHntGt5/zAfZb/8DqVQqvPjifNatXUMum+Xhhx9k/rznueSSb3PeORcxe/YcLr/s2zwz2Ml3C2tY7Mu8TYUsQZO4MmQDhlbEtt6kUdU8lhCFQARn4zgGo02q39Y00tYZDGwSJZ94gLLfTnDDE4b13TFHvucIrv/FjbS1d3DfvfdwySUXEoYBxWIxcQPjmPvvu5tsLs9e++xLo+FYtGgxB+23lDef2ZO5u8WwdBn09NJowKsr4Lm3Yl5YZVjcFRBn8kyesiMH7xQwQzr52xubWPfILH514yq+97Dw+ffvwoubqvx50yC9XYN09JbZxcP+NuCQXJbdwyzjGpa9wiyPTd2Rh9vLfO3pf9CVy3DAIe9GrOWN1xbwx0d/j7UBilAsFtm0eRPnnHsmYRhy3LEfZpddZnPZpZdw1VuLmBIUOC3YgYfizfQZh0lZF1tDVC10F0kY3BhNqPca2EAzmjKkRYap6qPmc6WJrQvfeI/jqPd68ibkvPuUjo52urp6aMSwaNGiJH2ZyxPFSRhugwAfRfzhkQd48YV5bFi7kN9dN50vnFhi8PW1/OUXfTz/FryyOmRNfzuZ9snssvNEDjmqwJnThbmFHsZGXdBTZvadG/j5ZbOZZAe45LAyv58f0vfyBn539CSYM4GNmR1ZNBDxwsYyz2+ocvemMo2+PqY2lL3U8q4wz7GFdlbtuBdX9G7ml3fdzhuLFrJqxXKMGIwxCeDoHPl8nsHBQd5+522OeO9RhEGWsePGE6jwcLAHhzKO9abKo9pFSaRJrx/2XoaCV0FTYD0hjZMxqoXAe0KXCQIin9BfR1k2TXtsjVCPYc+pnoNneWqrlXvme8Rm+cNjf+bZ5+ZxwUWXsmLlCkQE7z3S4oRnwpD+/gEqgwu4+IzJrFhR473HbmZTpY2xU3Znr90mcPxn2zhsN2H3KVXMwGZ4cyN09hH1x5DN8IV7YybsM54zPpGl+o+l5EPDb08yHPCDLg63Me+fUGBStZtjMiHHFDMwpZ3auIks98JLvVXmdQ3wi74K3+lbzxQV3p0p8eHCWB5ZuIBCNosNgiFDKinYKCKsXLmCp558gv/+7yvo6e5GcwF/i7dwcDCG42Qcj/gtGBmW3FagrhkHpIMbKxobsB5yAQm1xkPK3pft8CFJ0NFyHY7YRSmOVV5+w/DaekM+9Jhckf7+fq64/BLy+QK5XDalKQ6vHq9JciYMctzzUC9HHDaJ0742jUPnhuwyOQJZC4Pd0NuPWwm1JaB9BmdCSm0ZnnzHcv96eOumafg3ViKxpxoH7D/Nc+kxllOfq7H4yCImgLjukHIVrVWIO4WdsMzNZPiibafcNoZVQcxLUZ1nq4O8FFUZk81TJ6VxiyQOI+C9J5PJ8I+nnuRPf/ojArQXi/THdZ6inys05ghpYywhjW1YjWkCSbZKagiRh5pALUiORipY3zQbQzmOrVBPSWq+OGIXRQ08s0yo1qG9JETOkclkUJQ4jhAxIwPDZkWbh6MPsGDh1mtr0LUc+hs01ke4SBC1GM0gdTB1j4YGGyu1mvDFhytcc8Esdmnro/ZaHzYToA2l3g9XHxXw4BsNLnh9gBv36CBuKCIWm4O4AANVoa8eE0cx3gljMHyKLEcEWRZHdYoE/EV7KEiIU22JZJMALooaZFPaZeQcWSxva4UVvsxukme25FlAmRwWl+YCdITxHcJIjSCxEak6qBhrJLJOIhLvx7TSxUfqfog9TCjCftM90oD5K2UYj05zsIkAmW30mKYrqFrznPCegM2dnofuKRNHUKmFKDksIcaBeA/dDhoeF0EmG3DRnyIm7zmGC0/M03h1DTZjIVaIBB8ZJPLcc1zITRvL/LOzTtFYYpc41wm1MCn+McZibEAVQ4zhR41O5kqJ3U0On8Y4zZtWaZYgSILKktQrKBCK0EXMQl8mg2Uv8kSaDqC28OeHc9lNt8aDmqRWTryJDbExOERUjFgQ1KWFES26yJBAzjuOVWaNU2oD8NYGIQjYKi+7vfyUDmHk7QU49fgObrgvIhCHcQ6iFIKNFWqg3eBiQ8Ea5i2F/10i3H7VdKJ31tCoOOJYEk0aCxoJg73CARMtl+wfcPJbfdQdBF5QL0lCRwXnhdgnghRg6PbK39wgX8tOpeyiEcLSCv9KOnbN7GBzdTjxvE0NMOwm+W3ve8j+NY2DioHAKwVVzauqGGmIc0ZiFVezRutDkZwwwhcVgcjDrPFKUIA13Yb1/ULGjuT/tzoAslXKtomN9PbGfP6DGd5aG/D6q55soPiGhyjl7PeDryQwV+QsJz9c59tnTmPvKb2EPX2U2gPyBrSRlCUVAqEtF0Bd+J+9cwRF5dIVfeStIY4FxKRFxwanQgS0EfDHqI/xtsD+toNeHw8n/Zsxj4wE2mSblKiwQuqoKLtIIeGq6uiFBn54ejyISUtorbFGYiN4VampUmM7XyAC6oTdJiumAzb1Q181sQnbUEJG0Ei2/bZaHfKuwrHvLvKT+xwSJsw3YkGcQI/iIsjlA676ewM7s8iVpxZ44eFNfP3OgK/dEfDkm0IWCHzAPa8HnPKnmKvneyou5O6DCvxsUx/z+uoUMfi0xCnhFhm8CrEKd8a9fD6Ygm/UECNbif+IUR8pWQxnATfQQICdTZ4CJtX/o6Ru8c315ECb1W8StJ4XCFGzeMZs5QKpKlag5g2LVirzVgjeyzYJ+5Go4OgTIKFBl1U546gin/yeYcsqYWxWiSOFBsR9Qj40vLYSfrAAXn1wMgv/uprDrlGK+QDvPbc9L7z8Jcs/V3nOeUKZ2gZ3DMY8vmqAfx7ZwTlzSpy8sotFs6djMSk9JVlkRbU8Hw/SifLRYCxdlSqhmK3GfzTiugxRZZIqcdhMxIA2sB5KWHrFjQpL6LBbk7J8TCbAY1RVvMeGhqyD7BA1cquKFeeFYg6ue0LY+6KAyx4LKOYSPr8MMQJGq7jY9mKMAemMOLQjYqdZOW75c4wNwUeCdoNEgpiAUx5tcOap49l7SoXnn62yw1hYcIbwq48kAc9jbwu3vA6TCo6lnypy8uyAf22K+Od6+MmsNvol4rsbeymS0NHVg1chpwG3Nbr4SHYy+UipDkmtbHu526l1dyhZsSymyiz3Iof7BQwajx0Jvg2NnyCa5g7EIIEoNobYiIiGIKImRFM4WrYlQhiBWgzf/oDjTxc7TjpYqdaSfLBuUxIno95E0x8eMvBr6nztSMuvn4G4bAliIe6GXN7ww2diesbl+eGX8jT+vYEvvktYchFMyjhuejnhie4+xrCiz7FLe0gB2L1oMWJ4fUsdGxnumD2Ra3t6eKVcY2wQEImQUcty3+B5X+PkYDLr4xqBsdsM2rAKGm0VJCLnUTIYTpYpXBbOYjIh8dYqKK10bUkUZxLKkI+awJDxqiZWrE2dV/UjOVDJbyYu5jG7w4cPc+w20RG7VAFtkzjTbfToiOM+qZuvr444abahKiF/eVEJG5CJhRWbLFfN99x+2Vgya7YQ15ScKHjLib+3PLvKcfPRAUeMg0qcfncc4F1SRhSqQeuGDxSLfHFciS93bcb6xBNqx3Jv1M1eYQe7+ixbXB07FLPoEANDRylp2sbBUaWohqvtTL5tZjKZDJHqNq0HhpX4EMTpJeGEi2lW2ybepIwuCOkMGoFyQ3H9UKmNNLqjO6Iy6pSgCl6o1wylPsfxB2W4/gkHfUKA5auPRXzuxHaOnNWguqRMEAbUaob/utvz+FLluqNCTp1ryXvL5Lxh1UBMVFaW9SdpptlBiDSEatnz8/ETWeUb/GyghxlBhk3Oc3/cw1cyU+lqVBPIRP9j/eyoGn1IFYmy2dep+AZefQJHjKg7bhrhlDWcpLh9WiFpTWBNHBtxajE+adOyjR7UFlDJ+ySgygQ6cpUwWjXiVvPZTFD4JIASG6CrYr6xh+Ffq6B7nfDAIlgglp9/uUD0ajdeDBlr+OmzAQ++qZhAueUtZdItdZ5YB+ftlmVd2bPHU/38dl2dI8fnOCyfoVaHRmwYS8jN4yZzWWUzG1zEs/EAIgFH0856VyMUO1yyOCIGlRGZ8ZG1wsOCZRGyJNCFGzWHzshcpWA8FBRyXjUTaEr8UVWLSrhdzwXFe6EWCVgoZIa9fR0lcT+6FUtfOw+RwTihMSjs1QEHzQw5+5mYf61VbrhiPG2dfZT7HGICGn3C3KLnG/sGZEQYrCr1Qki7MZw305CplXhmS8ynxuY4d0IbxlnqcfL9fbHjM/mx3Br2cdrAGqri+Vx2Cho7olE6lWxVijy65Ke37lHyCBmx1EWppVCabqOWdehL0+lrFl8R+KQXjE+jZbMVgIG2SELsYaCevB5X0JG5glap0dZlpFsFCh4daqghOBFcj+XSdxX46O+6OP2kdv7rMA/zKpTaMtAQqAmfmmv41G4B1E3yaFioJO+dO9ty7g7B8DFnyEqQaFgRiC2PdsxiTtcS+pznN8FU1tWqZMQkfrcO1zMrWy8FHbVwT9IyxzYCihi6iOlPM2OjBGM6zCUxovhml5YgiQMaoOrrotRH5wENP28eSKZxchsY28qDlO0vP2lNQyflSc0mG2pJSk67kki0uyvm9Ktq9PbaBBNKm2nEkSOOHQlxxiQQg9ckCeIN6pLfCLAYn/SVMF4IEBqxZ0ebJ69QF0OlUSfyqSbRtKfHUA+JUXD4UW7MpF7QRALyYujWiAFc4oYOpYeHcaVmxXLSOSOIBBoKBNaIIwNSxRlJr2PrgKQlu7a2N4njZo1TCplELcloPKKRy6jlO9IOKU6InWFM3vLYCscJ/67wiYMz3PtklQ/umefomZb+fkfOSJJB9WDEIGmnFfGCRkAjwNU0AQC9wbt0OWPwIkQOiibkp5WNZE3A7hLy8drr/DbYjTEEbEFHYFny/9NDoYXxsBM5EMsGjRhUR0Zsagt0hEPqhweiMUynlVpQN+JCEDE2q7hAnaZheQs2nTZSQpTlW9KwwgqlLPRWk8BqdChuZB1uq3B5J4wpWP6wwnHCvwf5yZeFc44M+OUjlh/8I+aWgwJ22C0PA81yVTPcliYyCWhXDqivDvBi8Mbg1BKLgEkSG5EXJodZbqh3kkf4U9u+5OvKuSzhFL+YW80c2gmGgUIZwQEZUdWvW5XzqybvTjM5hICNvkFdfApHjyRs+VQBSaKemlUP4iAKCkMz72KgMQKAanXdFXIBLFxnOPr7lueXJgObCWSoslB1lEhyuNPC0JdFscfkA+58M+abb5d56ELLx3eIqTxf5oy92hisGubcVeHlj5SYmzcMVg2BkwRBcUkpo/FCfUDpLCctf2IPsXMpQ12oeZhGlu82NnJNvInn2w7CVWIWuio/CmZzg1vLKW4xN5rZzDEFYj/cNkflPwXDSrOVVoGA77gVPKxbMAo5ksK/kVOWDLzBqIIRNDBCXb30WpUBEzmf9HNz6JAKGkI1ZQQp11roHISesueaT3uO3y+pcLdp453R/eWmChsWsUk54b6Xa1y8ospTlxo+PjGm+pYjDAyV5Q0umZHhsiPzvOdvZVZXhTabrOFQhMAL1qXPPikgRAWjaYO7tNxphslyX9TDD6JNPNNxIB2RsDiukBHDYlfl63Y6F4Y7coZfxiKt0NZkPMtWcj+KRRUgVmW8BlxpZjFWQ96k2hLQjYyDEiWiSSgrWD/cJItAFQk8tjKq56UtAJSkle3Ct46L+exHPPc/ZrjvpZSU5JOcg4zi2DUbJTlVcln47b8N2UzMs5cKOzUc1ZUQGAs1Q5hR+lfEXD49T3lfOPTvAyw8so1JCNUIbNriTNOOW84n6kZV8Ap1D5M0yyONPi5vbOSvHfszJQpYGA1SMMGQ777K13mfjGWMMVwTrWTAKKGY4U4vMprySWmZQBXHXqaDy+0sBnAcGL/MauoEKWd0OHegrXMoCl6UQCF0EvshKALFeI/ZJrjaZjkqf3vT4Dvh0JkwpSNJ1Mj28Gcd6fwEVvjLIuG4CRl2WmZhncGEiUuqUdJyLFP0dL0Vc+20AifsnOXwfw/SVxcyTvBx2qLMW9QlsLLXBGSre5hAhifjAc5rrOOhtn2YFWd4qzFIJm1LAIkgZdJJEAnoQ3lBB8hiW3H7rQZgeAWbNAY4ijYcnqe1m5VaJYO0UJdbo4ChFKe2hBk20CAwgBoRP+RbbSW1mqYZNY2fsiE8v0Lo7YUdJ3mO2NlTayjWDhfxbYdfnU6C0J43nP7XOkfc02DeoiLZtSXCaiYJY6Kk4DrMQs9Kxy9ntHPYpCxHvNxP7A3WGXyceEOuIThNXNKah3FkmBdXOK2+hjvb9mJvX+DtRplsGu0mOSkFDCuIuJNOTqst4lVbpmRC4u3Wnw3jQQaIUcZoyPsZgwX+4fuIxG/XG2z1E6XZPRJiDdQaa8Q5QyySRGYtrusIcKo5uDkLy7YIT75jIAOnHOixZhjxkeZnRlWfgrWWwUqNGdMn8UZuCof9s48z5nk2vFUgt66EryTBeCYDIpa+9Z7fzRzLTm0h71vYQ6AW40hWgreoCnUVxkrIa67GqbVV/Kq0B+/WdhZFgxRsQJQ2X3QIW9Rzv3ZyeeMdHqmtY+eddyZ0Sqw+sSf/qZVt2o22jOMo6WBvU2ILDZ7QniFIYzQ/VtOMmAy1LlQFIu/coHFeg8AnjVAFGs18emssIM0kdVqp7j3c87JFK3DsXM+hszzlGtih+jEdtaQvsJZyucL0HaZz7/2/519//wsf+9jHuXFdhXe9McD/Lhb88jbMxiJeDKFJnLmBjY5Hp48jCC0fe3sLWWfAB3g11DWJRhfHDb5QW8WPi7txLB0sigZpMyE1lCpQU+FfOsC1rOKOxmpcW5GLLriY+x54iNPPPodavZ6UB8n/1VgtCe5ONZMIxfK07+UtqZLHjKgekhHOuLRCFLbFHhjjM5j0fJM0Sd2616uMgJljD8UMPPEOvLhCyJbggqN0qMHS6IGMEtiAcqXMlKlTuf+BB9hnv30o1+p8+KOf5LJLv02PyXDays18cGU3z6y1sLpIrT/ANZJZLXd5/jZlEmsVvrS+j4w3NCKlhGWdi/h0ZTmXZGdxgoxjSVTBiNDlI/qd5x1X5Qa/mp/Vl7K01scB+xzAxRd+m9m77wkC551/PueffwHlcgURs9UkpEByKv39RByubbxfxlDD8Vu/KanmkYRgtZX/t9UIyhBFKu27bYxp4FRVlMQIS5qxamL4W+OamrYqHGwI1//Log04fn/P5w/2VGpJxeLWg29tQKVSYfLkyTz40IPstfdevP76G8yb9xLGGF54+SVmzZjBqad8iXkm5P2r1nBeZx/rByxuMEdPJWQgFrSs/HPqdP4xWOPCjVuYIhk2xp5PV1dyZn4mX7KTeSUaoAfPgIfNPuZ3bgP/7ZYyr9HF/vsewEknfZ5NnZvY3LmJvv4+5s9/ic7OLVx0ySWcc+65lMvlRBVtpQaaEtyulv+xsyiZDP/Ufp7QPkoSpJ3It4r+R+aEScc5UkmaNY3MCSfxQqwIGB3ZyC61zk0THjullBUeXmh4bolhn50SeMm51gRSSmW3lmq1yrjx4/n97x9k77334vVFb7Jg4RuMHTee391+G8uXLeWMs88jm80xd8+9eeThB/nfec/xl0adc/LtnJBtQzAs05jJDc/Tk6Zx2KY1FFwXjzTKfCKYzJdkEv+OEjhMFeb5Hh7WzayjRimb59QvfI5ddt2NbDZLqb2dO++4jS9/9RvsOHMnXnrpVQ455CAuu/wKokaDG2+8kVKphHPxEBxpNfH9Y1VeYZB9tMRP3Toio2RHLw0bQe0RjIpg0v6/gVcthM12sJpiWtKMld220d+IXIom4bXzyrmPBhx0bcj9Cw1H76qUG83iuGTwa7U6Yzo6+P3vH2Df/fflzbfe4e23lzBhwgTuvusO1q9by0XfuozAGnLZLIVSid6+XnLWssk7LhzYwud7N/BsvUrBB6yvGxq1gLvbduDqwc1M1wKn2ik8Fw1i1LLG1/iJW8kv/Go2S0RRQqI4Ykv3FsaPH0+1UmbuHnvwhZO/zO2/uZX169YQRTGvvvoamzdv5sqrvstXvvxlBgcHCWww5HZG6plChg/JWM6JF3NYvIDn6CePJdp6+GWYkkNLB8kkyJNAVYtqNK9JI/IhOpiIpJbE6yjJFRlm/abQdCaEV9Yka+mVi2P+fkbMITOgXIVskPRpKBaL3Hf//Rx48EG8/fY7vP32UjrGjOX23/yaTRs3cOEl3yYIAubM2Y04irjme1fx1ptvYMIQq1ASy/NxnZMHNnBJpZMu71AvTNMsh4YlDqCd/jgBAO7zm/iuX8YCBimagDBtWy3AY394mAcfuIc5c3Yjm8kwe86ufP7kU7nt1l+xfv1aoihm4cJFbOnq4pof/IDPf/6/GBgcJLQBAtTVcaXZkT+E+3KTncubWhkBUm5fZFsmQZvOvjTES10JAmONuFjEW0VEm02CWxPpW9MUh6vEYwf5EGIHhQBsVrn1pJhdJkK9EZHLZrj33ns59LBDeeftxSxdtooxY8fwv7+6kU0bN3LpZd+ho72d/ffdj7ffeoMLLzibzZs3ps0vEsMWAwUxZMTw+1o/Jw2u4xe1bmKUyRKQxTBP+7k8XsZDugnEUDABTmQoPSIiFIsFnnzicX7642uZNnU6kydPZp999uOUL32VX996M2vXrCaKHG+9+Q7d3T385Kc/5/jjP0n/4CA1C2eZ6fyXmUikEQsYJBQzgv+5XSChJZGfIODeiCQdsBWsEUk6JHslo6RFfyL/R563Waya1JOt6obP3WEZ7BfmzoK9pzhiNdx1150cedSRLF68hNWr19HW1s5Nv/wFUb3Btd//EZPGT2DXOXN46KEHuPCCc2k0GuRyebx3IyJRn1qskrWU8fyi3sXnKmtZ5WN+r5u51q9is0SUJARJIA/VkVC6iz2lUpGXXnqBS791PvV6nSmTp/Luw4/g66edwW9+cwtr1q6i3oh4++0l9PX384tf3sQHjjuOuFzjI+FEMpLher+eX/n15I1NgLe0Pky28Rdb6wKGaqvFa4JdqiVQqxlbzAZjxfqcj9lhQjv7ffZQPzMwcMszRroGBWuG1U/yGEY4m+2B8xlY0WnYUrbMWwK3zBfu/t1v+PDHP87ixUtYt24TuXyeX/7iOtpKJb5z5X8TBJb2jnZuuP7nXPfzn5LP5bDW4v22JJfWntyCkBPDBnVsVkcnDbJisSJDnoiOkhNqJkhy2SwbN25k3vP/Zv/9D2DCxMlMmzqN3Xffg1/fcjM77bwLY8aMob9vgI4xHZz4qU8x74X53LL0BXKZLFe6FQmNJb33Vv7a1gQ1CzTwHKpj+YBO1HnSK0+b7vV5sSsi0U0KfcZ5DYwj4xPIv96yYrZiNGxtC4ad/iiGtqLwm5cM1zzhuO3WmznhxBNZtnQZnZu3kMvnuemmX7DD9Bl869LLcC7GGOHyyy7hllt+RalUTCS9JXHX2glFdaRvHQFZhIwRssYmrcpaiR9bV1npMCfJOUepWKRz82Yuufg8Fi54GRsEzNp5Z86/4Fs8cN/drFm9mtgpK5avpOE9v7vjTqbtvy/nDL6JhMFwolJGKoaRcNiwHfWizfNVRJMiVEdkRGoGkMAQNTt8NVvNq26fFpaMfbOhkyDGohjiRpWbb/oFJ5/yRZYtW05nZzfWBvz61v9lj7l78PXTvkkcx1Qrg5xx+mn88Y9/pK1UwqWtxFoDHz/UYiBpM6Dej5Ayz7A35rVlwLXZv8EPVXY223o3Bcc5Ry6Xo1atcsXll/DUk38jl8szbfoOnHnW+Tz6yEOsXr2SeiNmxfKVFAoFHrzvAebuuiuD5TImCLZH42LUDI4KkqJQ6XlGE8/WGiM4F0ucdptxzieQgjU6KtNXmqF1qpKMMdjAMliu8OMf/5jTvnE6q1atprOrF+eVe++9h4MOOpgTT/wMxggrVyzlK1/6Ai+/9BJtpRKxi7dqF9zSBGNo6JIJcc4N24etUVqvqPr0MbLTVlNYWhsteO8Jw5DAWn7yw2u5987fkMtlmTJlKl/7+uk89eQTrFmzmqjhWLZsBVOmTeXBRx5h6tRpVKtVrLVb0VVku0yiTCs9PLlMl25PIcYYcbEhNiJRI8Y1HGQClVxASljaps1/y1gpgTUMDAxy5ZVXcsEFF9C5pZONG7fQqEc89eQTHHbo4Rx55PvIZjM89+zTfPnLp7J85Voy+SKiUVrQoMMD16SFt+wpMAwPMNx8wzcnaHiyhhMgMuIzQ5nV5vc3z/SeAIPPZfjNb2/juh9fizEwYeJkTvrM51n0+kLWrVtLb98gS5YuZ+7cuTzy6KO0tbVRb9SxxrSoOx2BAYsMq6FMwpWgIc4hJhRD4EUiQI0q4jyBUZVqQ+u1enKxhcy2aOY2fFFr6R8Y5Kwzz+Sqq66it7ePN95YTKVS5Y1Fr7P/fgew9z77UizmuffuOzj99DOpVOtc/sGQvcY36C8ngxIabUHSdXini21Un7RA5EnnLe91hPoa6Sy0Yjkjt4cKEerqGXANPivj+UBpMo/95c9ccelFRI0ENjn66GNYtWoV/f19rFu7kcVLlnLQQQdx7333EQQhXluLELcqBxpOBlJMiQtl9U7xeMWq0UDiOLL5jJ0oopl8RkpRrHM+tj/7TJug8uiLhrc3GLJhkmNlq1yxNYZqrcZBBx7Iffffz8DgIIveeIuBwQpd3d3suOMMpk6dTj6X5Sc/upbrrr+eie0ZHjnV85XDY06YnVzxKxuEgXrSY9S0JBSkpb62tfCDltWxjWqUZlFFK/w1nMVqTkCEUlHHbJPlJ9mZfCfcgc+biSwOYh5f9Q7zn/s3hx52KFOm7kBbWzvl8iDWWPr7BxGBdx18MFEU8cQTT5DP5Yfs09ZUQZvmDk7wUziADv+I2RwvMP2dOezqSHSN877HpDvPeWuk3l+Vvq4BbRDA5I7EpZCtv1gY6ijunOO8888nDEPefmcJ9XqdNWtW09fXx7Rp0xFxnH/+2dz2m99QLBYxImzoA1+DCUXlh8fF/PNUx+f3dBQDn9D7FEIDGSMERrCpKmnaHSNJHtgMvU4e0sLJbPXALZLqYE2LJ5QdJOR7uen8M78rpwQTCBHecGW6ohrZQo5Vq1byzdO+yqLXXmbWrJlkMnmWLluGV8+y5avo3LKFb37zm0yfNp1arbZNJU1rfXBGhSmaIULZIg2HGodIxXg/KCLOABoJPgAqDSobeqUfgZ3H6QhOp6pPDV0y+JVKhYMOPJATTjiBZctXUK81WLlqFQsXLmSPubvT3bWZU085mccff5y2thLqY3prcPLdIZ+4PeSVdYnvuN8Ex50neT49F6oN2KEIg3UYqEPNJVSY0CYuZ5hu7GBN4igkDJSkxUsgQkaSxH2YbtygCGX1DPiEsTZGDEbhwcJOXJ6dwmQb0kXEf0dreW/9dZ6gn8BBLl+gUqlw9tln8tCD9zJ3992o1Wq88soCoijinXeWMnnyZE4/43QaUYSxdtgGSStzTikRMIMCgxLLRmpxAFUvWvEiFSNSsaV8MEacaC4bt3eXZYe9prHT0XN14sAgcv/LlsAy1H12iJAaJCDbj378I/baa28WL1nGgoWvs3zFKg479BC6uzbzzW98neUrViSdsKKENW8E8hll0UbDPa8b1vQKu45VymXhzMct758Jf/xYzMHjhDEZiLzQ34DBGBouoZJFaR2fJ+mz4FWpp8cbCg0PDZ9kwMYZ4cBMli8U2ri2NIET8u38b6WHLMKRYTu3R12cXlvFfb6bwFiyYpJNLNUTBBZjLU899RQuqnHMscfR2bmF1avXUCgWyeVzHH74Ydx1110M9PcT2GAo4iVFTxt4dtMiZ+iOskFq/haztjs2ukpVl3ojqy10B3XQDGgtklouI10L18iGuMKuB83ETuvwbOg3Sb+2IWzfUqlU2W/ffTnhU5/i9Tfe5LXX3yCbzbDv3nP565//wH333ZsEPKUicRSNMOKRg1JWcSrc9KLh4XeEKQUYjODS/WMmjVNOynpO2tkwMAhLe4R3eoS3+2BFRdhQhb5IqXhhRcXRHghTM5Y2I0wKDNOMYVYQsHuQYVeTYZbJELggbYIacHy2nZvrXfzbV3jFVQjE0Jbi+a45gM2WAybBkH59220sWLCAL576JWbsMJ0Vy1eCej7+8Y/wzW9+kyuuuCIpTI/iYUcfIUI5UNsZryGPmy3RFtPoLxBU6uL6Auf760EQBQkcraZRpz4up1teXsX6NzaY+r67+Nx7Zqu5cx5kC2kXrbThmXOOs846k0qlzrJlKwgDw8svzeeB++9nS1cX+XyeTGgTLucItnDyHLmEolrKKd1V6KwI+RAuec7yyU3K+ybD7kVoy8D+k4X9xwvUk4pIrQpxBD0Ny24vVvn0hCw/m5lHI0Po043bmuw5ZyFS1rkGL0Yxf6yWeTmuY43wmqtSkoQF0WgN8oacAJP0gxOhVCry8iuv8PIrr3DcscfysY9/kmq1zvPzXuSLp5zCjTf+kq4tXQRB0FLgoeTU8AEdTyyq/5TuagPtyys9zprNEfQZ8IEqEhmJvTPlQkjP+i7W/nGB9O67O5O+eKiae1/SoWahxljKlSr77bcvJ332v/jb3/7O43/7E3/502OsW7+BbDZDqVRMmu75xGa41L8f0VE2RSpdajyzRnFeeHaj8Ox6oS0He4yBd40T9h+j7Fo0TA+FsUBBlTA0jNHEHS0ZCDKGuKFUPfRGjk11ZVXF8WbD81It4pVGg9UuTjrAiyS7HyFEaUwxtAVWc/BUh9xZawyxKsVCwiF8/O9/55//fIbjjvsAxxz3QfbaYw9OO+0bXHXVVWSzWeI4JgAqOA7Vdo72Y1lhyvFT0tVTUNsf45cKssFaWzeVSiTj8vkdBHyc8bmCcVOdY68dxsvHHz/PHdVR8Pnjrw/ksdcNbXlwWOq1OldccQVe4eabb2Lz5s1kwpBsNptEqumAN4Ml35QuHZkvlpZWLklE3fR6EvSz5oY38skFwpgQJmSEcYHQbiEUw5PdMTNzAbvmLT11R6+DLbGnxymDzfhAhJxJtnPVNKPl0veGHv8HF9cYg7UWawzWGpzzVGs1ioUC73//sXz2s5/l4osuYHNnJ2EQEHhlQGNuj+fyBb8DP7DLe79jl785VjJLq+Ie996/bBq5zQH9sbS1MV4EDaN8zubi8W152Wl1p77n2uP95y/4hJv66htGj/65lbhZhCyWYqlIZ+cWwjAgm83iXVPKE8n3Pu2MNmJPPB1BeWkGRkOdB1OPpulqWiNpuU9yrkvb1rvmzoaqlAJDwyuNVGItiXcUtPDzNK1ccemWql511H1thug3Ldv5DRF00/jCWosxiQtsrSV2jlqtRntbiUwmy+DAAHmx9GiDE/wk7or30g2mEX/MLlixzjRetaIv11RfcSKLa7VaN+BsqURoLa6hMZ5QxBnbllHz8ioZf8xsdthnjg/bRfSRBUYKmcQjqtZq5PN5jBicd0MNrF0Knm1zg63B1Xb26dJ0gppRq09jAu9TL4wk4Z+RZAOHjIBLmQpZI4QCNg39nXpir8TepxLvkxXZMvit0Mb2qwCGmZlDqqkF8BMRctkMUSOiXq+TtwEVYmZqjl+7uUyWrFxjl/f81XQt75BwWd3oK865dbbR6G4kew57W61ixlRR2tB6PSvq46CUEbtpUPyqLjPuI3v4yUfs7KVaQ55anGD/xtgEtUsl3DufTIT+hy2kWzqmbPcUGWbjtaKiTTDO+2TQvdehpEtTqhMJ98lzy2D7/0PFbG9H65Hwx+ggZ1JukTQiz4qlpjFFLHe6PTiYsfqg2VT/brByfZuEa6rqF3jRd7y1GypxPJii6moBMwharaL5fGSwoalFJj++6Hlljdh6Q8a/f1cdc9xcL41IeHJxkqTJ2HTDm7R2QEdACNvWiMtWpLHhlMIwstrae1m32qFTWlZT66AOoaZDFMrhEqmmV9NsFCNDm4ymNEORkb8/ynPrxuNDm4m2ROBBuj34gMaMJ+R3bk89lkn6oumLv27eWtOAtV78Yif6XCSyolar9TK897y27vQnhQKm0ciCcXEUS2ZiEf/kOxJ5J2OOmq1t75/rmdUm8q8VQtegkA0gMIm/3IQHhm6yCRGQNqRm5GC3gmZmxGQ0bzDd5G3o2PA5DKUAZQgzahIGhqDyIXxIhvYsawaqpuX48E7BrX9Lyulvhd2Te7TGEBhDKMkjRhkg5lDt0Lv8Xv49Ol4XSr8/2by+dqM0VmewSxqqz3v0nVy93llliBPkm3jRECW3VkMKhYgoynir3kdOGFOk9vhbUt3Qb8YcMZP2Q3f3+omdoRwjS7YIfVXBkYBpgZHk4qwhY4XACqEVQpM+W0NgE28nsMl5ybH0OfWEwvR7kkfiGWWsITSGQJrvS/o6oTAmj+HByVg79H7GGEJrk3PFpJ9pfdgEwjB2+G+TlMc2z8+kxwOT0M+r4qnimUGOi/1M/0u/q+5IQf4mndGp9s3166S+rCTB63VxC/HuDReFm/uJKmy1qXNzI+eh1+MhUy+RtVG2TbNuolUzsT3jZ24YMIccOpMDr/6gm/me2a4Aom8sRe5fZMyTKw1LtkB3DWI3SrOF7VEtRUb2utleQdaoDRzkPzQn0u110h698HGEn7z93V9NmgqdQIa9KOpHdIKeyESdTMn0a1V/IWv7fmpWb4yU9VnMkqq4V8TJojiurarCAInh3WYCtt5T3o6DTK1AwcaZNhNoCTHj23Nul66KnVOwuu8X9vezTznAT9xvhuYJ1TAguqpT9O3NsKpX2FIRBhtK5NJCiuYuEX7I/Uw2MnBN1nxaWd50dZvN03wChTdbjquT4TYK6flJ4bcgXob7tA01XzMJlK4y9N1Dfze3LW9+BzKCji+adMkSFTIKJQImS5ZZmtXdKTBNCwqGfmr6Z7rKv5S13fNloHMswSaHLmugr+HkrTiU1dVqtZfhLc39yGTlyIq65utgPGRqRQqhy+XEupKKHZ8P3XSQHTcPsvP4PLOPm+N3+OAcJh02VXM7j/Em6SOcfpdL/coIxaXujZPhveRjSc6JjSQ76jQL8UiL8ZqvJd0LXlqK9STpEeBE8C37yTf3o2/uHe+NJs8W1ApetGVf+aRtuUsKm5LJSEGvpL2ZjNgmfag6O9ZubbjXqcRP0tP4q3QPLJTy+hCzuU3Nxjq6JMIv9arLJYo2lmGQ4b0C/f/lhUlLGawFMu3thFGUz4Xe5zFuXGDNDoVApkVe27aUdZyIzJraxsydxuqkOR2am9lBbmIBW7KE2WYs5dMSMk2cd6+plKY7aRqVpHTZI6qi6THVhEOc5J2cIB7UiTb3ltdYksb7abd38UnDJ0XAGxWPogZVI5BIM2nTDm0OsE/7yWmzd0naHVtVBFGvaBUfd2kcraPuV1FvLNNqzxrTGKjgo6KY7hJmk/O6ooYsArc4bthySLXSn6icuEXt6P+PG9x6fEgluQ5sHJOxcbaEceNtYCbkjU4WkalVp221iPZ6LCUPWUFLVsiJSChCmG7Ka5N4Soe6vaSqOBhZjNbcVTJNpyZKKaX9qvfDRYw+icuHYjWT0IpJ+2AMb6adVCUP1UBo8r1prTWaSX5YfBpkx6h6TQYuQFScSk3xiBgNRWoZlf4MpmyQ7hhd6tWt9t5vwNourdd7BxJPJ2oZeL89A/ef6kFaV4NJDXQQtRM2GrliEPiS9ZpXzMTAaNGKtodWi6jJeWQcUNx6O3evKiKS7NmmaryIF3BpY32DMV7QUJWMaNJLM6m4TgZVUlp3c2sD45Oit612G1NUYjHJzavHqkoO0YKAQ8UpmhWRUL0qQsMg1WRjnebGClpP25xmEMmChiCxwCYv2hcrG1TZqMaXI+e2OGsHpCZxSLXWn+wZHw/tE7D92FT/YwQ+ykowgIyHMGondK4Yeu+DMPR57zUjzrcFltCrzRqjWVXCVCq9V5NNGif7hhcaxthcquIicc6lRcuK4I3abPqeS38zjac0TKvLYweNdNkE6Xlp/9O0d6o450lacWqsgbE2o6qhSLqf1LAfZIyTSjpYJtlmQTNYrDippxVlQQIxSc0Z3y0iDXWuzwXBoIh4KYuzDMYWfHdyLdF/Ujmj77Xx/z8Jzedg/HgkjrFxXMyoqs16H3jV0Gc0EBHvvQYtQFcYaBjEEsUi4qzXbARijFSTedHQGIlooD7QbPNzIZiIUCHyIaFVVetMXBMRp0kjUJFIhpqeSJIss2QQGskgh6qmkUS9UdqORzKpVZSEq5+sSJHIikRONVTVwIhE6fsqIq4Kaoxxpmzi5LcG1CaqTbuHvRvfokL/z8Hn/0P9jDYRqduATAapdZDxHuM91rlcPvS+Wa9gRMTVU32ea+kCU1M12ZZNq9OVEhsR51SzGmpIA5eW8TRB06ae983owIjEdYgziXQPnVMHl00sqlUIVFUCY6pOhyZXVTUQkTidgEAgjoxpaKImNZecJCKidREnIs5UTGwZjAJwXcODrVupm/+o87c+8P8ATLVT6Ujt5FUAAAAASUVORK5CYII=";

// 2014 DMG-style CR -> XP table (verified against DMG p.275), used only for
// the rough difficulty estimate. Keyed by numeric CR value so both "1/8"
// and "0.125" style entry resolve to the same lookup.
const CR_XP = {
  0: 10,
  0.125: 25,
  0.25: 50,
  0.5: 100,
  1: 200,
  2: 450,
  3: 700,
  4: 1100,
  5: 1800,
  6: 2300,
  7: 2900,
  8: 3900,
  9: 5000,
  10: 5900,
  11: 7200,
  12: 8400,
  13: 10000,
  14: 11500,
  15: 13000,
  16: 15000,
  17: 18000,
  18: 20000,
  19: 22000,
  20: 25000,
  21: 33000,
  22: 41000,
  23: 50000,
  24: 62000,
  25: 75000,
  26: 90000,
  27: 105000,
  28: 120000,
  29: 135000,
  30: 155000
};
function parseCR(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (s.includes("/")) {
    const [n, d] = s.split("/").map(Number);
    if (!d || isNaN(n)) return null;
    return n / d;
  }
  const v = parseFloat(s);
  return isNaN(v) ? null : v;
}
function crToXP(raw) {
  const v = parseCR(raw);
  return v !== null && CR_XP[v] !== undefined ? CR_XP[v] : null;
}

// Per-character XP thresholds by level: [Easy, Medium, Hard, Deadly].
const XP_THRESHOLDS = {
  1: [25, 50, 75, 100],
  2: [50, 100, 150, 200],
  3: [75, 150, 225, 400],
  4: [125, 250, 375, 500],
  5: [250, 500, 750, 1100],
  6: [300, 600, 900, 1400],
  7: [350, 750, 1100, 1700],
  8: [450, 900, 1400, 2100],
  9: [550, 1100, 1600, 2400],
  10: [600, 1200, 1900, 2800],
  11: [800, 1600, 2400, 3600],
  12: [1000, 2000, 3000, 4500],
  13: [1100, 2200, 3400, 5100],
  14: [1250, 2500, 3800, 5700],
  15: [1400, 2800, 4300, 6400],
  16: [1600, 3200, 4800, 7200],
  17: [2000, 3900, 5900, 8800],
  18: [2100, 4200, 6300, 9500],
  19: [2400, 4900, 7300, 10900],
  20: [2800, 5700, 8500, 12700]
};
const MULTIPLIER_ROWS = [1, 1.5, 2, 2.5, 3, 4];
function multiplierRowIndex(monsterCount) {
  if (monsterCount <= 1) return 0;
  if (monsterCount === 2) return 1;
  if (monsterCount <= 6) return 2;
  if (monsterCount <= 10) return 3;
  if (monsterCount <= 14) return 4;
  return 5;
}
function computeDifficulty(enemies, partyLevel, partyCount) {
  const withCr = enemies.filter(e => crToXP(e.cr) !== null);
  if (withCr.length === 0 || !partyLevel || partyCount <= 0) return null;
  const rawXP = withCr.reduce((sum, e) => sum + crToXP(e.cr), 0);
  let idx = multiplierRowIndex(enemies.length);
  if (partyCount <= 2) idx = Math.min(idx + 1, MULTIPLIER_ROWS.length - 1);
  if (partyCount >= 6) idx = Math.max(idx - 1, 0);
  const multiplier = MULTIPLIER_ROWS[idx];
  const adjustedXP = Math.round(rawXP * multiplier);
  const perChar = XP_THRESHOLDS[clamp(partyLevel, 1, 20)];
  const [easy, medium, hard, deadly] = perChar.map(n => n * partyCount);
  let band = "Trivial";
  if (adjustedXP >= deadly) band = "Deadly";else if (adjustedXP >= hard) band = "Hard";else if (adjustedXP >= medium) band = "Medium";else if (adjustedXP >= easy) band = "Easy";
  return {
    band,
    adjustedXP,
    rawXP,
    multiplier,
    easy,
    medium,
    hard,
    deadly,
    missingCr: enemies.length - withCr.length
  };
}
const STATE_KEY = "dndTracker.state.v3";
const ENCOUNTERS_KEY = "dndTracker.encounters.v3";
const PARTIES_KEY = "dndTracker.parties.v3";
const ENEMY_TEMPLATES_KEY = "dndTracker.enemyTemplates.v1";
const NPC_TEMPLATES_KEY = "dndTracker.npcTemplates.v1";
function makeDefaultAdvanced() {
  return {
    ac: "",
    size: "",
    speed: "",
    abilities: {
      str: "",
      dex: "",
      con: "",
      int: "",
      wis: "",
      cha: ""
    },
    skills: "",
    senses: "",
    immunities: "",
    resistances: "",
    vulnerabilities: "",
    traits: [{
      name: "",
      desc: ""
    }],
    actions: [{
      name: "",
      desc: ""
    }]
  };
}
function hasAdvancedInfo(adv) {
  if (!adv) return false;
  if (adv.ac || adv.size || adv.speed) return true;
  if (adv.abilities && Object.values(adv.abilities).some(v => v)) return true;
  if (adv.skills || adv.senses || adv.immunities || adv.resistances || adv.vulnerabilities) return true;
  if (adv.traits && adv.traits.some(t => t.name || t.desc)) return true;
  if (adv.actions && adv.actions.some(a => a.name || a.desc)) return true;
  return false;
}
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return fallback;
}
function initVal(c) {
  return c.initiative === null || c.initiative === undefined ? -Infinity : c.initiative;
}
function sortByInitiative(list) {
  return [...list].sort((a, b) => initVal(b) - initVal(a));
}
const TYPE_ORDER = {
  player: 0,
  npc: 1,
  enemy: 2,
  marker: 3
};
function setupSort(list) {
  return [...list].sort((a, b) => {
    if (a.type !== b.type) return TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
    return a.name.localeCompare(b.name);
  });
}
const PRESET_CONDITIONS = ["Blinded", "Charmed", "Deafened", "Frightened", "Grappled", "Incapacitated", "Invisible", "Paralyzed", "Petrified", "Poisoned", "Prone", "Restrained", "Stunned"];
function makeCondition(name, limit) {
  return {
    id: uid(),
    name,
    limit: limit === undefined ? null : limit,
    elapsed: 0,
    expired: false,
    carriedOver: false
  };
}
const INACTIVE_CONCENTRATION = {
  active: false
};
function makeConcentration(limit) {
  return {
    active: true,
    limit: limit === undefined ? null : limit,
    elapsed: 0,
    expired: false,
    carriedOver: false
  };
}

// Old saves stored conditions as plain strings and concentration as a bare
// boolean; upgrade both in place so the rest of the app can assume the
// richer {limit, elapsed, expired, carriedOver} shape everywhere.
function normalizeCombatant(c) {
  let next = c;
  if (next.conditions && next.conditions.some(cond => typeof cond === "string")) {
    next = {
      ...next,
      conditions: next.conditions.map(cond => typeof cond === "string" ? makeCondition(cond, null) : cond)
    };
  }
  if (typeof next.concentration === "boolean") {
    next = {
      ...next,
      concentration: next.concentration ? makeConcentration(null) : INACTIVE_CONCENTRATION
    };
  }
  return next;
}
function insertSorted(list, newC) {
  const arr = [...list];
  let idx = arr.length;
  for (let i = 0; i < arr.length; i++) {
    if (initVal(newC) > initVal(arr[i])) {
      idx = i;
      break;
    }
  }
  arr.splice(idx, 0, newC);
  return arr;
}
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Strips a leading color-swatch name (e.g. "Red Skeleton" -> "Skeleton",
// bare "Red" -> ""). Used both when re-picking a color and when deriving a
// duplicate's base name.
function stripLeadingColor(name) {
  const sorted = [...ENEMY_COLORS].sort((a, b) => b.name.length - a.name.length);
  for (const col of sorted) {
    if (name === col.name) return "";
    if (name.startsWith(col.name + " ")) return name.slice(col.name.length + 1);
  }
  return name;
}

// Turns a stored enemy name like "Red Skeleton" or "Skeleton 1" into just
// "Skeleton" for the Duplicate button. Leaves fully custom names untouched.
function deriveDuplicateBaseName(name) {
  let result = stripLeadingColor(name.trim());
  const m = result.match(/^(.*)\s\d+$/);
  if (m) result = m[1];
  return result;
}

// Finds the highest "<name> N" suffix already in use among existingNames,
// so a repeated batch continues counting instead of restarting at 1.
function nextStartNumber(existingNames, baseName) {
  let max = 0;
  const re = new RegExp(`^${escapeRegExp(baseName)} (\\d+)$`);
  existingNames.forEach(n => {
    const m = n.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return max;
}
function StatusPill({
  status
}) {
  const map = {
    active: null,
    unconscious: {
      text: "Unconscious",
      cls: "bg-amber-900/40 text-amber-300 border-amber-700"
    },
    stable: {
      text: "Stable",
      cls: "bg-sky-900/40 text-sky-300 border-sky-700"
    },
    dead: {
      text: "Dead",
      cls: "bg-neutral-800 text-neutral-400 border-neutral-600"
    }
  };
  const s = map[status];
  if (!s) return null;
  return /*#__PURE__*/React.createElement("span", {
    className: `text-xs px-2 py-0.5 rounded-full border ${s.cls} font-medium tracking-wide`
  }, s.text);
}
function DeathSaves({
  combatant,
  onUpdate
}) {
  const {
    deathSaves
  } = combatant;
  const toggle = (kind, idx) => {
    const current = deathSaves[kind];
    const next = idx < current ? idx : idx + 1;
    const updated = {
      ...deathSaves,
      [kind]: clamp(next, 0, 3)
    };
    let status = "unconscious";
    if (updated.success >= 3) status = "stable";else if (updated.fail >= 3) status = "dead";
    onUpdate({
      deathSaves: updated,
      status
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-4 mt-2 text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-emerald-400 font-medium"
  }, "Success"), [0, 1, 2].map(i => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => toggle("success", i),
    className: `w-3.5 h-3.5 rounded-full border-2 transition-colors ${i < deathSaves.success ? "bg-emerald-400 border-emerald-400" : "border-emerald-700"}`
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-rose-400 font-medium"
  }, "Fail"), [0, 1, 2].map(i => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => toggle("fail", i),
    className: `w-3.5 h-3.5 rounded-full border-2 transition-colors ${i < deathSaves.fail ? "bg-rose-400 border-rose-400" : "border-rose-700"}`
  }))));
}
function ConditionRow({
  c,
  onAdd,
  onRemove,
  onClearCarriedOver,
  onStartConcentration,
  onDropConcentration,
  onClearConcentrationCarriedOver
}) {
  const [adding, setAdding] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftLimit, setDraftLimit] = useState("");
  const [concAdding, setConcAdding] = useState(false);
  const [concDraftLimit, setConcDraftLimit] = useState("");
  const submit = () => {
    const name = draftName.trim();
    if (!name) return;
    const parsed = draftLimit.trim() === "" ? null : parseInt(draftLimit, 10);
    onAdd(name, isNaN(parsed) ? null : parsed);
    setDraftName("");
    setDraftLimit("");
    setAdding(false);
  };
  const startConcentration = () => {
    const parsed = concDraftLimit.trim() === "" ? null : parseInt(concDraftLimit, 10);
    onStartConcentration(isNaN(parsed) ? null : parsed);
    setConcDraftLimit("");
    setConcAdding(false);
  };
  const conc = c.concentration || INACTIVE_CONCENTRATION;
  return /*#__PURE__*/React.createElement("div", {
    className: "mt-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-1.5"
  }, !conc.active ? /*#__PURE__*/React.createElement("button", {
    onClick: () => setConcAdding(v => !v),
    className: "flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border font-medium border-dashed border-neutral-700 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300"
  }, /*#__PURE__*/React.createElement(IconSparkles, {
    className: "w-3 h-3"
  }), " Concentration") : /*#__PURE__*/React.createElement("span", {
    className: `flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border font-medium ${conc.expired ? "bg-neutral-800 text-neutral-500 border-neutral-700" : "bg-yellow-500/20 text-yellow-300 border-yellow-500"}`
  }, conc.expired ? /*#__PURE__*/React.createElement("span", {
    title: "Expired — announce it's over"
  }, /*#__PURE__*/React.createElement(IconFlag, {
    className: "w-3 h-3"
  })) : conc.carriedOver ? /*#__PURE__*/React.createElement("button", {
    onClick: onClearConcentrationCarriedOver,
    title: "Carried over from a previous fight — tap to clear"
  }, /*#__PURE__*/React.createElement(IconHelp, {
    className: "w-3 h-3"
  })) : null, /*#__PURE__*/React.createElement("span", {
    className: conc.expired ? "line-through" : ""
  }, "Concentration", conc.limit != null ? ` [${conc.elapsed}/${conc.limit}]` : conc.elapsed > 0 ? ` [${conc.elapsed}]` : ""), /*#__PURE__*/React.createElement("button", {
    onClick: onDropConcentration,
    className: "hover:text-white"
  }, /*#__PURE__*/React.createElement(IconX, {
    className: "w-3 h-3"
  }))), c.conditions.map(cond => /*#__PURE__*/React.createElement("span", {
    key: cond.id,
    className: `flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border ${cond.expired ? "bg-neutral-800 text-neutral-500 border-neutral-700" : "bg-violet-900/40 text-violet-300 border-violet-700"}`
  }, cond.expired ? /*#__PURE__*/React.createElement("span", {
    title: "Expired — announce it's over"
  }, /*#__PURE__*/React.createElement(IconFlag, {
    className: "w-3 h-3"
  })) : cond.carriedOver ? /*#__PURE__*/React.createElement("button", {
    onClick: () => onClearCarriedOver(cond.id),
    title: "Carried over from a previous fight — tap to clear"
  }, /*#__PURE__*/React.createElement(IconHelp, {
    className: "w-3 h-3"
  })) : null, /*#__PURE__*/React.createElement("span", {
    className: cond.expired ? "line-through" : ""
  }, cond.name, cond.limit != null ? ` [${cond.elapsed}/${cond.limit}]` : cond.elapsed > 0 ? ` [${cond.elapsed}]` : ""), /*#__PURE__*/React.createElement("button", {
    onClick: () => onRemove(cond.id),
    className: "hover:text-white"
  }, /*#__PURE__*/React.createElement(IconX, {
    className: "w-3 h-3"
  })))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setAdding(v => !v),
    className: "text-xs rounded-full px-2 py-0.5 border border-dashed border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
  }, "+ Condition")), concAdding && /*#__PURE__*/React.createElement("div", {
    className: "mt-1.5 rounded-lg border border-neutral-700 bg-neutral-900 p-2 flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("input", {
    value: concDraftLimit,
    onChange: e => setConcDraftLimit(e.target.value),
    onKeyDown: e => e.key === "Enter" && startConcentration(),
    placeholder: "Rounds (optional)",
    inputMode: "numeric",
    className: "w-28 text-xs bg-neutral-950 border border-neutral-700 rounded px-2 py-1 outline-none focus:border-yellow-500 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: startConcentration,
    className: "text-xs px-2 py-1 rounded bg-yellow-600 hover:bg-yellow-500 text-neutral-950 shrink-0"
  }, "Start"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-600 ml-auto"
  }, "Blank = count up")), adding && /*#__PURE__*/React.createElement("div", {
    className: "mt-1.5 rounded-lg border border-neutral-700 bg-neutral-900 p-2 space-y-1.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-1"
  }, PRESET_CONDITIONS.map(name => /*#__PURE__*/React.createElement("button", {
    key: name,
    onClick: () => setDraftName(name),
    className: `text-xs px-2 py-0.5 rounded-full border ${draftName === name ? "border-violet-400 bg-violet-900/40 text-violet-200" : "border-neutral-700 text-neutral-400 hover:border-neutral-500"}`
  }, name))), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5"
  }, /*#__PURE__*/React.createElement("input", {
    value: draftName,
    onChange: e => setDraftName(e.target.value),
    onKeyDown: e => e.key === "Enter" && submit(),
    placeholder: "Condition name",
    className: "flex-1 min-w-0 text-xs bg-neutral-950 border border-neutral-700 rounded px-2 py-1 outline-none focus:border-violet-500 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("input", {
    value: draftLimit,
    onChange: e => setDraftLimit(e.target.value),
    onKeyDown: e => e.key === "Enter" && submit(),
    placeholder: "Rounds",
    inputMode: "numeric",
    className: "w-16 text-xs bg-neutral-950 border border-neutral-700 rounded px-2 py-1 outline-none focus:border-violet-500 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: submit,
    className: "text-xs px-2 py-1 rounded bg-violet-700 hover:bg-violet-600 text-white shrink-0"
  }, "Add")), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-600"
  }, "Leave rounds blank = count up")));
}
function InitiativeEditor({
  value,
  onChange
}) {
  const display = value === null || value === undefined ? "" : value;
  const handleTyped = raw => {
    if (raw === "") {
      onChange(null);
      return;
    }
    const v = parseFloat(raw);
    onChange(isNaN(v) ? 0 : v);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onChange((value ?? 0) - 1),
    className: "w-4 h-4 flex items-center justify-center rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-xs"
  }, "−"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.1",
    value: display,
    placeholder: "—",
    onChange: e => handleTyped(e.target.value),
    className: "w-11 text-sm font-mono font-bold text-center bg-transparent text-neutral-200 outline-none border-b border-transparent focus:border-neutral-500 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => onChange((value ?? 0) + 1),
    className: "w-4 h-4 flex items-center justify-center rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-xs"
  }, "+"));
}

// Hand-drawn minimal line icons (Lucide-inspired: 24x24, currentColor stroke)
// replacing the emoji used throughout the UI, plus vector takes on the
// player/enemy/npc badges to sit alongside the uploaded logo mark.
const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};
function IconX({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    ...svgProps,
    className: className
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  }));
}
function IconFlag({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    ...svgProps,
    className: className
  }, /*#__PURE__*/React.createElement("path", {
    d: "M4 21V4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 4h14l-2.5 4L18 12H4"
  }));
}
function IconUsers({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    ...svgProps,
    className: className
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "7",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 21v-1a6 6 0 0 1 12 0v1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "17",
    cy: "8",
    r: "2.3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M15.2 14a5 5 0 0 1 6.8 4.5V21"
  }));
}
function IconClipboard({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    ...svgProps,
    className: className
  }, /*#__PURE__*/React.createElement("path", {
    d: "M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1Z"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "5",
    y: "5",
    width: "14",
    height: "16",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 11h6M9 15h6"
  }));
}
function IconScale({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    ...svgProps,
    className: className
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 3v18M5 6h14M8 21h8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M5 6 2 12a3 3 0 0 0 6 0L5 6ZM19 6l-3 6a3 3 0 0 0 6 0l-3-6Z"
  }));
}
function IconSave({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    ...svgProps,
    className: className
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 3v5h8V3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 21v-6h10v6"
  }));
}
function IconSparkles({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    ...svgProps,
    className: className
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19 15l.7 2.1L22 18l-2.3.9L19 21l-.7-2.1L16 18l2.3-.9L19 15Z"
  }));
}
function IconHelp({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    ...svgProps,
    className: className
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9.5 9a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2-2.4 3.7"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "17",
    r: "0.6",
    fill: "currentColor",
    stroke: "none"
  }));
}
function IconSkull({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "currentColor",
    className: className
  }, /*#__PURE__*/React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M12 0.034668C7.58171 0.0346494 3.99997 3.61637 3.99997 8.03467V11.1676C3.4725 11.2483 2.80957 11.4137 2.17083 11.7568C1.08501 12.3401 0.50669 13.3461 0.233669 14.274C-0.0362926 15.1914 -0.0467 16.1531 0.113639 16.8458C0.118576 16.8671 0.124212 16.8883 0.130538 16.9092C0.218209 17.1997 0.354168 17.4516 0.529981 17.6665C0.403319 17.8344 0.330281 18.004 0.289019 18.1107C0.193097 18.3589 0.134008 18.6372 0.0963214 18.9034C0.019985 19.4427 0.0101057 20.0899 0.0599281 20.7115C0.109221 21.3265 0.222428 21.9868 0.429691 22.5314C0.532653 22.802 0.678474 23.097 0.892953 23.346C1.11234 23.6006 1.45661 23.8639 1.93303 23.9095C4.23932 24.1307 5.4901 23.767 6.37946 23.0827C6.65738 22.8689 6.92378 22.5927 7.099 22.4111C7.15333 22.3548 7.19889 22.3075 7.23331 22.2741C7.41386 22.0985 7.5401 22.0118 7.71766 21.9583L7.71848 21.958L11.9945 20.6636L15.7347 21.8385L15.7347 21.8386L15.7461 21.842C15.8997 21.8883 16.1091 21.9976 16.4573 22.214C16.5334 22.2613 16.6161 22.3137 16.7045 22.3697L16.705 22.37L16.705 22.37C16.9809 22.5448 17.3112 22.7541 17.6633 22.9496C18.634 23.4884 19.8954 23.9999 21.5872 23.9999C22.5574 23.9999 23.1504 23.3076 23.4545 22.7074C23.7665 22.0916 23.9174 21.3329 23.9575 20.6153C23.9982 19.8892 23.9306 19.1154 23.7354 18.4403C23.6616 18.1849 23.5589 17.9075 23.4155 17.6421C24.0268 16.8215 24.0539 15.7398 23.8913 14.8992C23.6653 13.7309 23.0074 12.5018 22.2171 11.861C21.5427 11.3142 20.6057 11.1603 20 11.1074V8.03467C20 3.6164 16.4183 0.0346866 12 0.034668ZM5.07993 13.0901L5.09652 13.0906C5.11981 13.092 5.1432 13.0927 5.16663 13.0927C5.67074 13.0927 5.99996 13.4718 5.99996 13.8436V14.6496C5.99996 15.0944 6.29378 15.4857 6.72093 15.6099L8.52353 16.1336L6.48292 16.7515C5.2744 16.5242 4.05304 16.5428 3.03394 16.6916C2.58867 16.6355 2.33176 16.5563 2.188 16.4802C2.09581 16.4315 2.06934 16.3975 2.05409 16.358C1.98354 16.0142 1.97995 15.4244 2.15233 14.8385C2.32797 14.2416 2.64696 13.7713 3.11731 13.5187C3.55209 13.2851 4.04812 13.1722 4.46185 13.1229C4.66381 13.0988 4.83426 13.0912 4.95099 13.0895C5.00906 13.0887 5.053 13.0894 5.07993 13.0901ZM14.9059 16.3199L12.2848 17.0844L6.82116 18.7388C6.65783 18.7882 6.48455 18.7951 6.31783 18.7586C5.25172 18.5256 4.12357 18.5411 3.21081 18.6878C2.75081 18.7618 2.37932 18.8636 2.11626 18.9644C2.10306 19.0216 2.08923 19.0943 2.07658 19.1837C2.02497 19.5484 2.01289 20.0445 2.05353 20.5517C2.09471 21.0654 2.1844 21.5192 2.29891 21.8201C2.31664 21.8667 2.33361 21.906 2.34924 21.9385C4.20552 22.0865 4.83662 21.7463 5.15988 21.4976C5.31575 21.3777 5.41118 21.278 5.54345 21.1399L5.54346 21.1399C5.62213 21.0577 5.71384 20.9619 5.83905 20.8402C6.13969 20.5479 6.53666 20.2256 7.13986 20.0435L11.7102 18.6601C11.7259 18.6553 11.7416 18.651 11.7574 18.647L18.4002 16.986C18.5496 16.9487 18.7056 16.9463 18.856 16.9792C19.642 17.1507 20.753 17.0449 21.5612 16.6422C21.8688 16.4889 22.0891 16.1131 21.9277 15.279C21.7684 14.4556 21.2995 13.6918 20.9574 13.4145C20.7755 13.267 20.3573 13.1439 19.8017 13.0977C19.5548 13.0772 19.3277 13.0752 19.1621 13.0786C19.0799 13.0803 19.0147 13.0833 18.9718 13.0857L18.9435 13.0874C18.907 13.0909 18.8702 13.0927 18.8333 13.0927C18.3292 13.0927 18 13.4718 18 13.8436V14.6017V14.6496C18 15.0915 17.7099 15.481 17.2866 15.6076L14.9126 16.3179L14.9059 16.3199L14.9059 16.3199ZM15 13V14.2042L16 13.905V13.8436C16 12.577 16.8628 11.5559 18 11.2148V8.03467C18 4.72097 15.3137 2.03468 12 2.03467C8.68627 2.03465 5.99997 4.72095 5.99997 8.03467V11.2148C7.13715 11.5559 7.99996 12.577 7.99996 13.8436V13.8988L8.99997 14.1894V13C8.99997 12.4477 9.44768 12 9.99997 12C10.5523 12 11 12.4477 11 13V14.3599H12H13V13C13 12.4477 13.4477 12 14 12C14.5523 12 15 12.4477 15 13ZM2.16762 18.8031C2.16787 18.8038 2.16467 18.8118 2.15723 18.8249C2.16364 18.809 2.16736 18.8024 2.16762 18.8031ZM16.3289 19.9288L15.685 19.7265L18.6718 18.9797C19.607 19.1359 20.7222 19.0609 21.7221 18.7313C21.7524 18.8034 21.7837 18.8906 21.8141 18.9956C21.936 19.4175 21.991 19.9608 21.9607 20.5035C21.9298 21.0547 21.816 21.5162 21.6704 21.8035C21.6121 21.9186 21.5677 21.9746 21.542 21.9998C20.3123 21.991 19.3997 21.626 18.634 21.201C18.3372 21.0362 18.0787 20.8725 17.8143 20.705C17.7155 20.6424 17.6159 20.5793 17.5132 20.5155C17.1714 20.303 16.7623 20.0604 16.3289 19.9288ZM21.517 22.0178C21.5168 22.0167 21.5218 22.0125 21.5325 22.0084C21.5226 22.0168 21.5172 22.0189 21.517 22.0178ZM11 9.00003C11 10.1046 9.10583 11 8.00199 11C6.98775 11 6.99365 10.2441 7.00129 9.26451V9.26443C7.00196 9.17792 7.00265 9.08966 7.00265 9.00003C7.00265 7.89546 7.89749 7.00003 9.00133 7.00003C10.1052 7.00003 11 7.89546 11 9.00003ZM16.9974 9.00003C16.9974 9.08969 16.998 9.17797 16.9987 9.26451C17.0064 10.2441 17.0123 11 15.998 11C14.8942 11 13 10.1046 13 9.00003C13 7.89546 13.8948 7.00003 14.9987 7.00003C16.1025 7.00003 16.9974 7.89546 16.9974 9.00003Z"
  }));
}
function IconD20({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 800 800",
    fill: "currentColor",
    className: className
  }, /*#__PURE__*/React.createElement("path", {
    d: "M386.85 32.37C388.58 36.66 387.51 43.12 387.51 47.85C387.51 59.3 387.51 70.75 387.51 82.19C387.51 121.63 388.12 161.12 387.47 200.55C381.59 202.41 374.06 201.59 367.85 201.73C354.95 202.01 342.04 202.14 329.13 202.54C283.36 203.96 237.55 203.97 191.78 205.54C174.02 206.14 156.22 206.35 138.45 206.74C131.64 206.89 119.89 208.55 113.81 206.39C204.82 148.38 295.83 90.38 386.85 32.37ZM413.15 32.37C504.03 90.38 594.92 148.38 685.8 206.39C680.88 208.49 669.48 206.91 663.74 206.8C646.94 206.47 630.13 206.18 613.33 205.72C566.34 204.45 519.31 204.11 472.33 202.59C458.94 202.15 445.54 202.04 432.15 201.73C425.94 201.58 418.42 202.41 412.53 200.55C411.88 161.12 412.49 121.63 412.49 82.19C412.49 70.75 412.49 59.3 412.49 47.85C412.49 43.12 411.42 36.66 413.15 32.37ZM377.4 226.85C317.73 329.13 258.06 431.42 198.39 533.7C193.61 523.9 190.33 512.88 186.66 502.61C179.66 483 172.13 463.54 164.82 444.05C159.69 430.36 154.13 416.93 148.6 403.42C146.54 398.39 145.45 392.9 143.72 387.74C141.01 379.66 137.9 371.64 134.85 363.69C118.22 320.43 102.95 276.64 86.19 233.42C93.26 231.02 108.51 232.21 116.53 232.07C136.99 231.72 157.44 231.22 177.9 230.86C223.93 230.06 269.95 228.61 315.98 227.89C330.11 227.67 344.23 227.19 358.36 226.97C364.47 226.87 371.41 225.76 377.4 226.85ZM713.06 233.42C676.17 333.4 639.27 433.37 602.37 533.34C597.87 529.89 590.95 514.99 587.63 509.35C575.96 489.57 564.32 469.77 552.8 449.9C523.06 398.65 493.22 347.4 462.92 296.48C453.74 281.04 444.79 265.46 435.67 249.99C432.14 244.01 424.08 233.05 422.6 226.85C428.59 225.76 435.53 226.88 441.64 226.97C455.77 227.18 469.89 227.68 484.02 227.9C530.05 228.61 576.07 230.08 622.1 230.87C642.56 231.21 663.01 231.75 683.47 232.08C691.24 232.21 706.25 231.06 713.06 233.42ZM400 239.06C460.92 343.04 521.84 447.02 582.76 551C461 551 339.23 551 217.47 551C278.31 447.02 339.16 343.04 400 239.06ZM81.15 292.19C113.29 378.78 145.42 465.37 177.56 551.96C145.42 554.94 113.29 557.92 81.15 560.9C81.15 471.33 81.15 381.76 81.15 292.19ZM718.84 292.19C718.84 381.76 718.84 471.33 718.84 560.9C686.78 557.92 654.71 554.94 622.65 551.96C623.48 543.97 628.94 533.96 631.71 526.19C638.5 507.08 645.97 488.22 652.82 469.14C666.75 430.32 680.92 391.34 695.84 352.84C700.69 340.31 705.15 327.62 709.82 315.02C712.56 307.62 714.54 298.78 718.84 292.19ZM575.34 576.26C516.89 640.1 458.45 703.95 400 767.79C341.39 704.13 282.78 640.47 224.17 576.8C227.83 574.45 243.53 575.98 248.77 575.98C270.68 575.98 292.6 575.98 314.52 575.98C373.21 575.98 431.9 575.98 490.59 575.98C509.35 575.98 528.1 575.98 546.85 575.98C555.98 575.98 566.39 574.61 575.34 576.26ZM324.02 722.58C251.84 676.67 179.66 630.75 107.48 584.84C110.01 582.5 123.25 582.38 127.49 582.09C143.09 581.03 158.63 578.87 174.25 577.97C178.27 577.74 187.21 575.56 190.65 576.85C192.84 577.67 197.36 583.89 199.2 585.84C207.35 594.48 215.32 603.33 223.3 612.13C246.56 637.81 270.07 663.27 293.5 688.79C300.61 696.54 307.77 704.25 314.85 712.02C317.67 715.11 322.5 718.74 324.02 722.58ZM692.52 584.84C667.8 599.73 644 616.22 619.65 631.68C592.11 649.18 564.51 666.58 537.1 684.33C522.89 693.52 508.48 702.41 494.29 711.64C490.28 714.24 480.36 722.09 476.23 722.19C494.28 701.3 513.93 681.78 531.9 660.83C534.04 658.35 536.82 656.48 539.02 654.09C550.91 641.17 562.55 627.94 574.45 614.99C582.72 605.99 591.11 597.06 599.26 587.94C601.26 585.71 607.44 577.48 609.9 576.77C613.32 575.79 618.64 577.27 622.13 577.67C629.75 578.54 637.43 578.91 645.06 579.73C656.38 580.94 667.77 581.71 679.11 582.77C682.87 583.12 689.83 582.35 692.52 584.84Z"
  }));
}
function IconLibrary({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    ...svgProps,
    className: className
  }, /*#__PURE__*/React.createElement("rect", {
    x: "4",
    y: "4",
    width: "4",
    height: "16",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "10",
    y: "6",
    width: "4",
    height: "14",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "16",
    y: "3",
    width: "4",
    height: "17",
    rx: "1"
  }));
}
function IconBookOpen({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    ...svgProps,
    className: className
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 6a5 5 0 0 0-5-3H3v15h4a5 5 0 0 1 5 3 5 5 0 0 1 5-3h4V3h-4a5 5 0 0 0-5 3Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 6v15"
  }));
}
function IconSettings({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "currentColor",
    className: className
  }, /*#__PURE__*/React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M12.0002 8C9.79111 8 8.00024 9.79086 8.00024 12C8.00024 14.2091 9.79111 16 12.0002 16C14.2094 16 16.0002 14.2091 16.0002 12C16.0002 9.79086 14.2094 8 12.0002 8ZM10.0002 12C10.0002 10.8954 10.8957 10 12.0002 10C13.1048 10 14.0002 10.8954 14.0002 12C14.0002 13.1046 13.1048 14 12.0002 14C10.8957 14 10.0002 13.1046 10.0002 12Z"
  }), /*#__PURE__*/React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M11.2867 0.5C9.88583 0.5 8.6461 1.46745 8.37171 2.85605L8.29264 3.25622C8.10489 4.20638 7.06195 4.83059 6.04511 4.48813L5.64825 4.35447C4.32246 3.90796 2.83873 4.42968 2.11836 5.63933L1.40492 6.83735C0.67773 8.05846 0.954349 9.60487 2.03927 10.5142L2.35714 10.7806C3.12939 11.4279 3.12939 12.5721 2.35714 13.2194L2.03927 13.4858C0.954349 14.3951 0.67773 15.9415 1.40492 17.1626L2.11833 18.3606C2.83872 19.5703 4.3225 20.092 5.64831 19.6455L6.04506 19.5118C7.06191 19.1693 8.1049 19.7935 8.29264 20.7437L8.37172 21.1439C8.6461 22.5325 9.88584 23.5 11.2867 23.5H12.7136C14.1146 23.5 15.3543 22.5325 15.6287 21.1438L15.7077 20.7438C15.8954 19.7936 16.9384 19.1693 17.9553 19.5118L18.3521 19.6455C19.6779 20.092 21.1617 19.5703 21.8821 18.3606L22.5955 17.1627C23.3227 15.9416 23.046 14.3951 21.9611 13.4858L21.6432 13.2194C20.8709 12.5722 20.8709 11.4278 21.6432 10.7806L21.9611 10.5142C23.046 9.60489 23.3227 8.05845 22.5955 6.83732L21.8821 5.63932C21.1617 4.42968 19.678 3.90795 18.3522 4.35444L17.9552 4.48814C16.9384 4.83059 15.8954 4.20634 15.7077 3.25617L15.6287 2.85616C15.3543 1.46751 14.1146 0.5 12.7136 0.5H11.2867ZM10.3338 3.24375C10.4149 2.83334 10.7983 2.5 11.2867 2.5H12.7136C13.2021 2.5 13.5855 2.83336 13.6666 3.24378L13.7456 3.64379C14.1791 5.83811 16.4909 7.09167 18.5935 6.38353L18.9905 6.24984C19.4495 6.09527 19.9394 6.28595 20.1637 6.66264L20.8771 7.86064C21.0946 8.22587 21.0208 8.69271 20.6764 8.98135L20.3586 9.24773C18.6325 10.6943 18.6325 13.3057 20.3586 14.7523L20.6764 15.0186C21.0208 15.3073 21.0946 15.7741 20.8771 16.1394L20.1637 17.3373C19.9394 17.714 19.4495 17.9047 18.9905 17.7501L18.5936 17.6164C16.4909 16.9082 14.1791 18.1618 13.7456 20.3562L13.6666 20.7562C13.5855 21.1666 13.2021 21.5 12.7136 21.5H11.2867C10.7983 21.5 10.4149 21.1667 10.3338 20.7562L10.2547 20.356C9.82113 18.1617 7.50931 16.9082 5.40665 17.6165L5.0099 17.7501C4.55092 17.9047 4.06104 17.714 3.83671 17.3373L3.1233 16.1393C2.9058 15.7741 2.97959 15.3073 3.32398 15.0186L3.64185 14.7522C5.36782 13.3056 5.36781 10.6944 3.64185 9.24779L3.32398 8.98137C2.97959 8.69273 2.9058 8.2259 3.1233 7.86067L3.83674 6.66266C4.06106 6.28596 4.55093 6.09528 5.0099 6.24986L5.40676 6.38352C7.50938 7.09166 9.82112 5.83819 10.2547 3.64392L10.3338 3.24375Z"
  }));
}
function IconTrash({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    ...svgProps,
    className: className
  }, /*#__PURE__*/React.createElement("path", {
    d: "M4 7h16"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10 11v6M14 11v6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"
  }));
}
function IconRotateCcw({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    ...svgProps,
    className: className
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 12a9 9 0 1 0 3-6.7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 3v5h5"
  }));
}
function IconToolbox({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    ...svgProps,
    className: className
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "8",
    width: "18",
    height: "12",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 13h18"
  }));
}
function IconDownload({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    ...svgProps,
    className: className
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 3v12"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 10l5 5 5-5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 20h16"
  }));
}
function IconUpload({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    ...svgProps,
    className: className
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 21V9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 14l5-5 5 5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 20h16"
  }));
}
function IconUndo({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    ...svgProps,
    className: className
  }, /*#__PURE__*/React.createElement("path", {
    d: "M9 14 4 9l5-5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 9h10a6 6 0 0 1 0 12h-2"
  }));
}
function IconChevronDown({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    ...svgProps,
    className: className
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 9l6 6 6-6"
  }));
}
function IconChevronUp({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    ...svgProps,
    className: className
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 15l6-6 6 6"
  }));
}
function IconChevronRight({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    ...svgProps,
    className: className
  }, /*#__PURE__*/React.createElement("path", {
    d: "M9 6l6 6-6 6"
  }));
}
function IconShield({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: className
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20 6C20 6 19.1843 6 19.0001 6C16.2681 6 13.8871 4.93485 11.9999 3C10.1128 4.93478 7.73199 6 5.00009 6C4.81589 6 4.00009 6 4.00009 6C4.00009 6 4 8 4 9.16611C4 14.8596 7.3994 19.6436 12 21C16.6006 19.6436 20 14.8596 20 9.16611C20 8 20 6 20 6Z"
  }));
}
function IconSwords({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 -0.05 87.686 87.686",
    fill: "currentColor",
    className: className
  }, /*#__PURE__*/React.createElement("path", {
    d: "M472.334,146.1l-3.381,3.162-2.83-2.828,4.464-4.464a2,2,0,0,0-2.827-2.829l-4.466,4.464-2.835-2.835,3.555-3.817a2,2,0,1,0-2.928-2.725v0l-3.456,3.714-2.926-2.926-6.778.675-.674,6.776,4.829,4.829-7.231,8.924-.049,0a8.711,8.711,0,0,0,0,17.422h.007a8.693,8.693,0,0,0,6.151-2.551l-1.412-1.414,1.414,1.414a8.7,8.7,0,0,0,2.549-6.161c0-.017,0-.034,0-.05l8.925-7.229,4.828,4.828,6.778-.675.673-6.778-.67-.668-2.26-2.261,3.285-3.073a2,2,0,0,0-2.733-2.92Zm-24.2,22.159a4.711,4.711,0,1,1-3.331-8.042,4.782,4.782,0,0,1,.746.071c.143.024.284.059.424.094s.259.07.387.115.252.093.375.148a4.526,4.526,0,0,1,.446.235c.093.054.189.1.278.166a4.642,4.642,0,0,1,.642.524l.032.026c.008.009.014.019.023.028a4.881,4.881,0,0,1,.526.643c.064.094.116.193.172.29.083.141.161.285.229.432.056.128.107.258.152.389s.077.242.108.364c.038.148.076.3.1.448a4.919,4.919,0,0,1,.071.736,4.688,4.688,0,0,1-1.381,3.332Zm4.251-7.617c-.021-.038-.051-.072-.073-.111a8.6,8.6,0,0,0-.48-.732c-.05-.07-.1-.139-.152-.207a8.54,8.54,0,0,0-.717-.825,8.769,8.769,0,0,0-.822-.715c-.07-.055-.142-.1-.214-.157a8.577,8.577,0,0,0-.731-.479c-.037-.022-.071-.051-.109-.072l1.845-2.276,3.729,3.73Zm5.4-4.376-4.322-4.322,1.463-1.806,1.759,1.76,2.9,2.906Zm12.6,1.878-1.633.162-3.191-3.191h0l-7.3-7.3-6.842-6.842.161-1.631,1.634-.162,12.156,12.156,3.489,3.489h0l1.685,1.685Zm15.906-44.963,21.46-22.93,8.02.879-25.512,25.512a2,2,0,1,0,2.828,2.828l25.491-25.49.9,8L496.96,123.047a2,2,0,0,0,2.732,2.922l23.983-22.447L521.9,87.773,506.2,86.05l-22.829,24.394a2,2,0,1,0,2.922,2.732Zm28.575,43.035-.049,0-7.232-8.924,4.829-4.829-.676-6.776-6.778-.675-2.928,2.928L453.466,86.05l-15.705,1.724-1.772,15.749,51.893,48.565-2.93,2.931.1.942.578,5.834,6.78.675,4.827-4.827,8.924,7.23c0,.016,0,.032,0,.048a8.71,8.71,0,0,0,8.71,8.712h.008a8.711,8.711,0,0,0-.008-17.422ZM451.915,90.245,499.2,140.768,496.37,143.6,443.895,91.125ZM440.19,101.974l.9-8,52.452,52.452-2.829,2.83Zm53.915,53.135h0l-3.191,3.191-1.634-.162-.161-1.632,17.329-17.329,1.633.162.163,1.631-8.666,8.666Zm5.97-.31,4.665-4.666,1.463,1.806-4.323,4.323Zm9.448,3.25a8.7,8.7,0,0,0-.818.713h0l0,0a8.557,8.557,0,0,0-.708.812c-.059.075-.113.152-.168.228-.168.232-.324.469-.467.713-.024.04-.055.077-.078.118l-2.276-1.844,3.73-3.73,1.845,2.276c-.038.021-.071.049-.108.071a8.691,8.691,0,0,0-.729.478C509.669,157.941,509.6,157.993,509.523,158.049Zm8.671,10.2a4.678,4.678,0,0,1-7.97-4.068,4.413,4.413,0,0,1,.1-.442c.032-.126.068-.252.111-.375s.094-.255.149-.38a4.686,4.686,0,0,1,.233-.443c.055-.094.106-.19.168-.281a4.694,4.694,0,0,1,.55-.673l.005-.005a4.889,4.889,0,0,1,.669-.546c.09-.061.186-.111.279-.166a4.832,4.832,0,0,1,.445-.234c.124-.055.25-.1.377-.148s.255-.081.384-.114.282-.071.427-.1a4.757,4.757,0,0,1,.745-.071,4.709,4.709,0,0,1,3.33,8.041Z",
    transform: "translate(-435.989 -86.05)"
  }));
}
function IconMask({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 512 512",
    fill: "currentColor",
    className: className
  }, /*#__PURE__*/React.createElement("path", {
    d: "M293.686,333.324c5.976,52.529,58.497,59.684,74.014,59.684c15.521,0,68.042-7.155,74.01-59.684c-9.545,8.358-40.582,22.691-74.01,22.691C334.276,356.014,303.239,341.681,293.686,333.324z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M312.681,272.069c12.31,1.33,23.671,5.338,33.591,11.37c0.394-17.695-12.824-33.041-30.747-34.969c-17.827-1.92-33.926,10.126-37.423,27.344C288.894,272.189,300.622,270.778,312.681,272.069z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M389.129,283.439c9.919-6.032,21.285-10.039,33.587-11.37c12.067-1.291,23.786,0.12,34.579,3.745c-3.498-17.218-19.596-29.264-37.42-27.344C401.948,250.398,388.73,265.744,389.129,283.439z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M511.724,171.919c0,0-0.02-0.216-0.036-0.327l-0.02-0.104l-0.02-0.144c-0.948-6.86-5.975-12.389-13.05-13.106c-5.765-0.59-11.586,2.35-17.119,3.673c-11.405,2.693-22.97,4.74-34.535,6.462c-30.085,4.478-60.56,6.549-90.964,5.832c-23.604-0.55-47.223-2.621-70.552-6.278c-8.7-36.101-23.006-95.259-27.058-112.023c-0.82-3.402-1.43-8.724-8.29-3.792c-4.96,3.593-54.665,28.874-118.249,44.243C68.247,111.724,12.475,111.916,6.42,111c-8.346-1.275-6.466,3.744-5.641,7.146C5.133,136.16,21.294,203.039,29.7,237.777c20.496,84.87,111.994,128.117,164.213,115.489c11.242-2.717,22.918-8.573,34.125-16.939c11.282,46.108,43.136,86.902,84.714,109.784c13.413,7.378,28.077,12.979,43.311,15.027c14.935,2.023,29.942-0.167,44.14-5.02c27.938-9.56,52.665-28.213,71.624-50.649c18.481-21.886,31.731-48.227,37.172-76.408c2.506-12.964,2.848-25.934,2.848-39.073V186.977C511.848,182.029,512.262,176.842,511.724,171.919z M61.156,185.351c11.358,0.972,23.082-0.398,34.487-4.493c11.656-4.176,21.776-10.733,29.99-18.932c4.534,17.098-4.705,35.129-21.679,41.2C87.086,209.182,68.606,201.262,61.156,185.351z M223.564,256.612c-13.808-2.852-33.539-3.991-52.84,0.685c-28.596,6.908-52.18,25.576-58.625,34.691c-5.744-46.156,37.694-63.134,50.98-66.354c10.202-2.47,40.001-5.832,60.485,12.629V256.612z M231.835,159.648c-1.932,3.928-4.581,7.466-7.844,10.406c-5.008,4.526-11.405,7.633-18.6,8.581c-17.875,2.327-34.324-9.489-38.108-26.794c11.07,3.554,23.046,4.764,35.328,3.171c12.019-1.57,23.082-5.705,32.734-11.76C235.564,149.083,234.289,154.677,231.835,159.648z M488.574,284.937c0,12.708,0.16,25.337-2.079,37.91c-1.933,10.867-5.247,21.448-9.72,31.519c-0.056,0.104-0.112,0.231-0.164,0.358c-0.015,0.048-0.055,0.104-0.071,0.175c-0.088,0.183-0.164,0.374-0.251,0.557c-0.159,0.374-0.339,0.749-0.518,1.14c0.048-0.144,0.123-0.263,0.179-0.415c-11.354,24.644-29.67,46.164-51.892,61.66c-12.302,8.589-26.109,15.593-40.813,18.939c-13.732,3.155-27.284,1.825-40.57-2.701c-27.826-9.506-52.032-29.814-69.01-53.526c-13.286-18.564-22.277-40.076-25.496-62.576c-0.88-6.103-1.326-12.302-1.326-18.516V184.149c14.274,3.513,28.83,6.102,43.438,8.07c9.314,1.275,18.676,2.295,27.986,3.14c31.193,2.805,62.548,2.964,93.757,0.43c25.66-2.079,51.514-5.497,76.551-11.656V284.937z"
  }));
}
function IconStop({
  className
}) {
  return /*#__PURE__*/React.createElement("svg", {
    ...svgProps,
    className: className
  }, /*#__PURE__*/React.createElement("rect", {
    x: "5",
    y: "5",
    width: "14",
    height: "14",
    rx: "2"
  }));
}
const TYPE_STYLE = {
  player: {
    icon: IconShield,
    border: "border-sky-800/60",
    bg: "bg-sky-950/10",
    iconBg: "bg-sky-900/40 border-sky-700 text-sky-300"
  },
  npc: {
    icon: IconMask,
    border: "border-stone-600/60",
    bg: "bg-stone-800/10",
    iconBg: "bg-stone-700/40 border-stone-500 text-stone-300"
  },
  enemy: {
    icon: IconSwords,
    border: "border-rose-900/60",
    bg: "bg-rose-950/10",
    iconBg: "bg-rose-900/40 border-rose-700 text-rose-300"
  },
  marker: {
    icon: IconFlag,
    border: "border-indigo-800/60",
    bg: "bg-indigo-950/10",
    iconBg: "bg-indigo-900/40 border-indigo-700 text-indigo-300"
  }
};
function TypeIcon({
  icon: IconComp
}) {
  return /*#__PURE__*/React.createElement(IconComp, {
    className: "w-4 h-4"
  });
}
function AdvancedFieldsEditor({
  value,
  onChange,
  accent,
  cr,
  onCrChange
}) {
  const [open, setOpen] = useState(false);
  const update = patch => onChange({
    ...value,
    ...patch
  });
  const updateAbility = (key, val) => onChange({
    ...value,
    abilities: {
      ...value.abilities,
      [key]: val
    }
  });
  const updateListItem = (field, idx, key, val) => {
    const list = value[field].map((item, i) => i === idx ? {
      ...item,
      [key]: val
    } : item);
    onChange({
      ...value,
      [field]: list
    });
  };
  const addListItem = field => onChange({
    ...value,
    [field]: [...value[field], {
      name: "",
      desc: ""
    }]
  });
  const removeListItem = (field, idx) => onChange({
    ...value,
    [field]: value[field].filter((_, i) => i !== idx)
  });
  const inputCls = "text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none placeholder:text-neutral-600";
  return /*#__PURE__*/React.createElement("div", {
    className: "border-t border-neutral-800 pt-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(v => !v),
    className: `w-full flex items-center justify-between text-xs font-semibold ${accent}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(IconSettings, {
    className: "w-3.5 h-3.5"
  }), " Advanced"), /*#__PURE__*/React.createElement(IconChevronDown, {
    className: `w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`
  })), open && /*#__PURE__*/React.createElement("div", {
    className: "mt-2 space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5"
  }, /*#__PURE__*/React.createElement("input", {
    placeholder: "AC",
    value: value.ac,
    onChange: e => update({
      ac: e.target.value
    }),
    inputMode: "numeric",
    className: `${onCrChange ? "w-1/4" : "w-1/3"} ${inputCls}`
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Size",
    value: value.size,
    onChange: e => update({
      size: e.target.value
    }),
    className: `${onCrChange ? "w-1/4" : "w-1/3"} ${inputCls}`
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Speed",
    value: value.speed,
    onChange: e => update({
      speed: e.target.value
    }),
    inputMode: "numeric",
    className: `${onCrChange ? "w-1/4" : "w-1/3"} ${inputCls}`
  }), onCrChange && /*#__PURE__*/React.createElement("input", {
    placeholder: "CR",
    title: "Challenge Rating (optional)",
    value: cr,
    onChange: e => onCrChange(e.target.value),
    inputMode: "decimal",
    className: `w-1/4 ${inputCls}`
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-600 mb-1"
  }, "Ability score modifiers"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-6 gap-1"
  }, ["str", "dex", "con", "int", "wis", "cha"].map(k => /*#__PURE__*/React.createElement("input", {
    key: k,
    placeholder: k.toUpperCase(),
    value: value.abilities[k],
    onChange: e => updateAbility(k, e.target.value),
    inputMode: "numeric",
    className: `text-center px-1 ${inputCls}`
  })))), /*#__PURE__*/React.createElement("input", {
    placeholder: "Skills (e.g. Perception +3)",
    value: value.skills,
    onChange: e => update({
      skills: e.target.value
    }),
    className: `w-full ${inputCls}`
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Senses (e.g. passive Perception 13)",
    value: value.senses,
    onChange: e => update({
      senses: e.target.value
    }),
    className: `w-full ${inputCls}`
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Immunities",
    value: value.immunities,
    onChange: e => update({
      immunities: e.target.value
    }),
    className: `w-full ${inputCls}`
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Resistances",
    value: value.resistances,
    onChange: e => update({
      resistances: e.target.value
    }),
    className: `w-full ${inputCls}`
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Vulnerabilities",
    value: value.vulnerabilities,
    onChange: e => update({
      vulnerabilities: e.target.value
    }),
    className: `w-full ${inputCls}`
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-600 mb-1"
  }, "Traits"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1.5"
  }, value.traits.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "flex gap-1"
  }, /*#__PURE__*/React.createElement("input", {
    placeholder: "Name",
    value: t.name,
    onChange: e => updateListItem("traits", i, "name", e.target.value),
    className: `w-1/3 ${inputCls}`
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Description",
    value: t.desc,
    onChange: e => updateListItem("traits", i, "desc", e.target.value),
    className: `flex-1 ${inputCls}`
  }), value.traits.length > 1 && /*#__PURE__*/React.createElement("button", {
    onClick: () => removeListItem("traits", i),
    className: "text-neutral-600 hover:text-rose-300 px-1"
  }, /*#__PURE__*/React.createElement(IconX, {
    className: "w-3 h-3"
  }))))), /*#__PURE__*/React.createElement("button", {
    onClick: () => addListItem("traits"),
    className: "text-xs text-neutral-400 hover:text-neutral-200 mt-1"
  }, "+ Add Trait")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-600 mb-1"
  }, "Actions"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1.5"
  }, value.actions.map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "flex gap-1"
  }, /*#__PURE__*/React.createElement("input", {
    placeholder: "Name",
    value: a.name,
    onChange: e => updateListItem("actions", i, "name", e.target.value),
    className: `w-1/3 ${inputCls}`
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Description",
    value: a.desc,
    onChange: e => updateListItem("actions", i, "desc", e.target.value),
    className: `flex-1 ${inputCls}`
  }), value.actions.length > 1 && /*#__PURE__*/React.createElement("button", {
    onClick: () => removeListItem("actions", i),
    className: "text-neutral-600 hover:text-rose-300 px-1"
  }, /*#__PURE__*/React.createElement(IconX, {
    className: "w-3 h-3"
  }))))), /*#__PURE__*/React.createElement("button", {
    onClick: () => addListItem("actions"),
    className: "text-xs text-neutral-400 hover:text-neutral-200 mt-1"
  }, "+ Add Action"))));
}
function StatBlockPanel({
  advanced: a
}) {
  const abilityRow = Object.values(a.abilities).some(v => v);
  const infoLines = [["Armor Class", a.ac], ["Size", a.size], ["Speed", a.speed], ["Skills", a.skills], ["Senses", a.senses], ["Immunities", a.immunities], ["Resistances", a.resistances], ["Vulnerabilities", a.vulnerabilities]].filter(([, v]) => v);
  const traits = a.traits.filter(t => t.name || t.desc);
  const actions = a.actions.filter(t => t.name || t.desc);
  return /*#__PURE__*/React.createElement("div", {
    className: "mt-2 rounded-lg border border-amber-900/40 bg-amber-950/10 p-3 font-serif"
  }, infoLines.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-neutral-300 space-y-0.5 mb-2"
  }, infoLines.map(([label, val]) => /*#__PURE__*/React.createElement("div", {
    key: label
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-amber-300"
  }, label), " ", val))), abilityRow && /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-6 gap-1 text-center text-xs border-y border-amber-800/40 py-2 mb-2"
  }, ["str", "dex", "con", "int", "wis", "cha"].map(k => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-amber-300"
  }, k.toUpperCase()), /*#__PURE__*/React.createElement("div", {
    className: "text-neutral-300"
  }, a.abilities[k] || "—")))), traits.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "space-y-1.5 mb-2 border-t border-amber-800/40 pt-2"
  }, traits.map((t, i) => /*#__PURE__*/React.createElement("p", {
    key: i,
    className: "text-xs text-neutral-300"
  }, /*#__PURE__*/React.createElement("span", {
    className: "italic font-bold text-amber-200"
  }, t.name, "."), " ", t.desc))), actions.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "border-t border-amber-800/40 pt-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center text-sm font-bold text-amber-300 tracking-wide mb-1"
  }, "Actions"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1.5"
  }, actions.map((act, i) => /*#__PURE__*/React.createElement("p", {
    key: i,
    className: "text-xs text-neutral-300"
  }, /*#__PURE__*/React.createElement("span", {
    className: "italic font-bold text-amber-200"
  }, act.name, "."), " ", act.desc)))));
}
function CombatantCard({
  c,
  isCurrent,
  inCombat,
  onUpdate,
  onRemove,
  onEndTurn,
  onInitChange,
  cardRef,
  onSetClipboard
}) {
  const [statBlockOpen, setStatBlockOpen] = useState(false);
  const [dmgInput, setDmgInput] = useState("");
  const [healInput, setHealInput] = useState("");
  const style = TYPE_STYLE[c.type];
  const dead = c.status === "dead";
  const isPlayer = c.type === "player";
  const isEnemy = c.type === "enemy";
  const isNpc = c.type === "npc";
  const isMarker = c.type === "marker";
  const pct = isEnemy || isNpc ? clamp(c.currentHp / c.maxHp * 100, 0, 100) : 0;
  const applyHp = delta => {
    const newHp = clamp(c.currentHp + delta, 0, c.maxHp);
    const patch = {
      currentHp: newHp
    };
    if (isEnemy) {
      let status = c.status;
      let revived = false;
      if (newHp === 0) status = "dead";else if (status === "dead") {
        status = "active";
        revived = true;
      }
      patch.status = status;
      if (revived) patch._revive = true;
    } else if (isNpc) {
      let status = c.status;
      let revived = false;
      if (newHp === 0 && c.currentHp > 0) {
        status = "unconscious";
        patch.deathSaves = {
          success: 0,
          fail: 0
        };
      } else if (newHp > 0 && status !== "active") {
        revived = status === "dead";
        status = "active";
        patch.deathSaves = {
          success: 0,
          fail: 0
        };
      }
      patch.status = status;
      if (revived) patch._revive = true;
    }
    onUpdate(patch);
  };
  const applyDamage = () => {
    const n = parseInt(dmgInput, 10);
    if (!isNaN(n) && n > 0) applyHp(-n);
    setDmgInput("");
  };
  const applyHeal = () => {
    const n = parseInt(healInput, 10);
    if (!isNaN(n) && n > 0) applyHp(n);
    setHealInput("");
  };
  const setDown = () => onUpdate({
    status: "unconscious",
    deathSaves: {
      success: 0,
      fail: 0
    }
  });
  const setAlive = () => onUpdate({
    status: "active",
    deathSaves: {
      success: 0,
      fail: 0
    },
    ...(c.status === "dead" ? {
      _revive: true
    } : {})
  });
  const isDownGroup = c.status === "unconscious" || c.status === "stable" || c.status === "dead";
  const markDead = () => onUpdate({
    currentHp: 0,
    status: "dead",
    deathSaves: {
      success: 0,
      fail: 0
    }
  });
  return /*#__PURE__*/React.createElement("div", {
    ref: cardRef,
    className: `rounded-xl border p-3 transition-all ${dead ? "opacity-50 border-neutral-800 bg-neutral-900/40" : isCurrent ? "border-amber-400 bg-amber-950/20 shadow-lg shadow-amber-900/20 ring-1 ring-amber-400/40" : `${style.border} ${style.bg}`}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start justify-between gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: `flex items-center justify-center w-8 h-8 rounded-lg border shrink-0 relative text-sm ${style.iconBg}`
  }, /*#__PURE__*/React.createElement(TypeIcon, {
    icon: style.icon
  }), c.color && /*#__PURE__*/React.createElement("span", {
    className: "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-neutral-950",
    style: {
      backgroundColor: c.color
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: `font-semibold truncate ${dead ? "line-through text-neutral-500" : "text-neutral-100"}`
  }, c.name), dead && /*#__PURE__*/React.createElement(IconSkull, {
    className: "w-3.5 h-3.5 text-neutral-500 shrink-0"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mt-0.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-neutral-500"
  }, "Init"), /*#__PURE__*/React.createElement(InitiativeEditor, {
    value: c.initiative,
    onChange: onInitChange
  }), /*#__PURE__*/React.createElement(StatusPill, {
    status: c.status
  })))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 shrink-0"
  }, (isEnemy || isNpc) && !dead && /*#__PURE__*/React.createElement("button", {
    onClick: markDead,
    title: "Mark dead",
    className: "text-neutral-600 hover:text-rose-400"
  }, /*#__PURE__*/React.createElement(IconSkull, {
    className: "w-4 h-4"
  })), isEnemy && !inCombat && /*#__PURE__*/React.createElement("button", {
    onClick: onSetClipboard,
    title: "Set as Duplicate source",
    className: "text-neutral-600 hover:text-sky-300"
  }, /*#__PURE__*/React.createElement(IconClipboard, {
    className: "w-4 h-4"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: onRemove,
    disabled: inCombat,
    title: inCombat ? "Can't remove mid-initiative" : "Remove",
    className: `text-neutral-600 ${inCombat ? "opacity-30 cursor-not-allowed" : "hover:text-neutral-300"}`
  }, /*#__PURE__*/React.createElement(IconX, {
    className: "w-4 h-4"
  })))), isPlayer && /*#__PURE__*/React.createElement("div", {
    className: "mt-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex rounded-lg border border-neutral-700 overflow-hidden text-xs font-semibold"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: setAlive,
    className: `flex-1 py-1.5 transition-colors ${!isDownGroup ? "bg-emerald-600 text-white" : "bg-neutral-900 text-neutral-500 hover:text-neutral-300"}`
  }, "Alive"), /*#__PURE__*/React.createElement("button", {
    onClick: setDown,
    className: `flex-1 py-1.5 transition-colors ${isDownGroup ? "bg-amber-600 text-neutral-950" : "bg-neutral-900 text-neutral-500 hover:text-neutral-300"}`
  }, "Unconscious")), c.status === "unconscious" && /*#__PURE__*/React.createElement(DeathSaves, {
    combatant: c,
    onUpdate: onUpdate
  })), (isEnemy || isNpc) && /*#__PURE__*/React.createElement("div", {
    className: "mt-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-neutral-500"
  }, "HP"), /*#__PURE__*/React.createElement("span", {
    className: "font-mono text-neutral-300"
  }, c.currentHp, " / ", c.maxHp)), /*#__PURE__*/React.createElement("div", {
    className: "h-2 rounded-full bg-neutral-800 overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: `h-full transition-all ${pct > 50 ? "bg-emerald-500" : pct > 20 ? "bg-amber-500" : "bg-rose-500"}`,
    style: {
      width: `${pct}%`
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 mt-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => applyHp(-1),
    className: "w-6 h-6 rounded bg-neutral-800 hover:bg-rose-900/50 text-neutral-300 text-sm font-bold"
  }, "−"), /*#__PURE__*/React.createElement("button", {
    onClick: () => applyHp(1),
    className: "w-6 h-6 rounded bg-neutral-800 hover:bg-emerald-900/50 text-neutral-300 text-sm font-bold"
  }, "+")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-1.5 mt-1.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("input", {
    value: dmgInput,
    onChange: e => setDmgInput(e.target.value),
    onKeyDown: e => e.key === "Enter" && applyDamage(),
    placeholder: "Damage",
    inputMode: "numeric",
    className: "w-full min-w-0 text-xs bg-neutral-900 border border-rose-900/60 rounded px-2 py-1 outline-none focus:border-rose-500 text-neutral-200 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: applyDamage,
    className: "text-xs px-2 py-1 rounded bg-rose-800 hover:bg-rose-700 text-rose-100 font-bold shrink-0"
  }, "−")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("input", {
    value: healInput,
    onChange: e => setHealInput(e.target.value),
    onKeyDown: e => e.key === "Enter" && applyHeal(),
    placeholder: "Heal",
    inputMode: "numeric",
    className: "w-full min-w-0 text-xs bg-neutral-900 border border-emerald-900/60 rounded px-2 py-1 outline-none focus:border-emerald-500 text-neutral-200 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: applyHeal,
    className: "text-xs px-2 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold shrink-0"
  }, "+"))), isNpc && c.status === "unconscious" && /*#__PURE__*/React.createElement(DeathSaves, {
    combatant: c,
    onUpdate: onUpdate
  })), !isMarker && /*#__PURE__*/React.createElement(ConditionRow, {
    c: c,
    onAdd: (name, limit) => onUpdate({
      conditions: [...c.conditions, makeCondition(name, limit)]
    }),
    onRemove: condId => onUpdate({
      conditions: c.conditions.filter(t => t.id !== condId)
    }),
    onClearCarriedOver: condId => onUpdate({
      conditions: c.conditions.map(t => t.id === condId ? {
        ...t,
        carriedOver: false
      } : t)
    }),
    onStartConcentration: limit => onUpdate({
      concentration: makeConcentration(limit)
    }),
    onDropConcentration: () => onUpdate({
      concentration: INACTIVE_CONCENTRATION
    }),
    onClearConcentrationCarriedOver: () => onUpdate({
      concentration: {
        ...c.concentration,
        carriedOver: false
      }
    })
  }), inCombat && isCurrent && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const tickedConditions = c.conditions.map(cond => {
        const elapsed = cond.elapsed + 1;
        const expired = cond.expired || cond.limit != null && elapsed >= cond.limit;
        return {
          ...cond,
          elapsed,
          expired
        };
      });
      const conc = c.concentration || INACTIVE_CONCENTRATION;
      const tickedConcentration = conc.active ? {
        ...conc,
        elapsed: conc.elapsed + 1,
        expired: conc.expired || conc.limit != null && conc.elapsed + 1 >= conc.limit
      } : conc;
      onUpdate({
        conditions: tickedConditions,
        concentration: tickedConcentration
      });
      onEndTurn();
      setStatBlockOpen(false);
    },
    className: "mt-3 w-full flex items-center justify-center gap-1.5 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-900 rounded-lg py-1.5 transition-colors"
  }, "End Turn ", /*#__PURE__*/React.createElement(IconChevronRight, {
    className: "w-4 h-4"
  })), (isEnemy || isNpc) && hasAdvancedInfo(c.advanced) && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setStatBlockOpen(v => !v),
    className: "mt-1.5 w-full flex items-center justify-center gap-1 text-xs text-neutral-500 hover:text-neutral-300"
  }, statBlockOpen ? /*#__PURE__*/React.createElement(IconChevronUp, {
    className: "w-3 h-3"
  }) : /*#__PURE__*/React.createElement(IconChevronDown, {
    className: "w-3 h-3"
  }), statBlockOpen ? "Collapse stat block" : "Expand stat block"), statBlockOpen && /*#__PURE__*/React.createElement(StatBlockPanel, {
    advanced: c.advanced
  })));
}
function EditorSection({
  title,
  icon,
  accent,
  open,
  onToggle,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `rounded-lg border ${accent.border} ${accent.bg}`
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onToggle,
    className: `w-full flex items-center justify-between px-3 py-2 text-sm font-semibold ${accent.text}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1.5"
  }, icon, " ", title), /*#__PURE__*/React.createElement(IconChevronDown, {
    className: `w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`
  })), open && /*#__PURE__*/React.createElement("div", {
    className: "px-3 pb-3 space-y-1.5"
  }, children));
}
function PillSwitch({
  checked,
  onClick,
  title
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    title: title,
    className: `w-9 h-5 rounded-full transition-colors relative shrink-0 ${checked ? "bg-emerald-500" : "bg-neutral-700"}`
  }, /*#__PURE__*/React.createElement("span", {
    className: `absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : ""}`
  }));
}
function RoundDivider() {
  return /*#__PURE__*/React.createElement("div", {
    className: "h-px my-1 bg-gradient-to-r from-transparent via-amber-500/70 to-transparent"
  });
}
function ConfirmModal({
  message,
  onCancel,
  onConfirm
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-sm rounded-xl border border-neutral-700 bg-neutral-900 p-4 shadow-2xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-7 h-7 rounded-lg overflow-hidden shrink-0"
  }, /*#__PURE__*/React.createElement("img", {
    src: LOGO_ICON,
    alt: "",
    className: "w-full h-full object-cover"
  })), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold text-neutral-200"
  }, "init.Lite")), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-neutral-300 mb-4"
  }, message), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onCancel,
    className: "flex-1 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg py-2"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: onConfirm,
    className: "flex-1 text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg py-2"
  }, "Confirm"))));
}
function EndInitiativeModal({
  onEnd,
  onReroll,
  onCancel
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-sm rounded-xl border border-neutral-700 bg-neutral-900 p-4 shadow-2xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-7 h-7 rounded-lg overflow-hidden shrink-0"
  }, /*#__PURE__*/React.createElement("img", {
    src: LOGO_ICON,
    alt: "",
    className: "w-full h-full object-cover"
  })), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold text-neutral-200"
  }, "init.Lite")), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-neutral-300 mb-4"
  }, "End this fight's initiative, or reroll enemies for a new one?"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onEnd,
    className: "w-full flex items-center justify-center gap-1.5 text-sm font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg py-2"
  }, /*#__PURE__*/React.createElement(IconStop, {
    className: "w-4 h-4"
  }), " End Initiative"), /*#__PURE__*/React.createElement("button", {
    onClick: onReroll,
    className: "w-full flex items-center justify-center gap-1.5 text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-neutral-950 rounded-lg py-2"
  }, /*#__PURE__*/React.createElement(IconD20, {
    className: "w-4 h-4"
  }), " Re-Roll Initiative"), /*#__PURE__*/React.createElement("button", {
    onClick: onCancel,
    className: "w-full text-sm font-medium bg-transparent hover:bg-neutral-800 text-neutral-400 rounded-lg py-2"
  }, "Cancel")), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-600 mt-3"
  }, "Re-Roll keeps player initiatives and rerolls enemies for a fresh round 1.")));
}
function CombatTracker() {
  const savedState = loadJSON(STATE_KEY, null);
  const [combatants, setCombatants] = useState((savedState?.combatants || []).map(normalizeCombatant));
  const [round, setRound] = useState(savedState?.round || 1);
  const [turnsThisRound, setTurnsThisRound] = useState(savedState?.turnsThisRound || 0);
  const [inCombat, setInCombat] = useState(savedState?.inCombat || false);
  const [savedEncounters, setSavedEncounters] = useState(loadJSON(ENCOUNTERS_KEY, {}));
  const [savedParties, setSavedParties] = useState(loadJSON(PARTIES_KEY, {}));
  const [showEditor, setShowEditor] = useState(false);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [showNpcForm, setShowNpcForm] = useState(false);
  const [showEnemyForm, setShowEnemyForm] = useState(false);
  const [showEncounterForm, setShowEncounterForm] = useState(false);
  const [showPartyForm, setShowPartyForm] = useState(false);
  const [showBackupForm, setShowBackupForm] = useState(false);
  const [showMarkerForm, setShowMarkerForm] = useState(false);
  const [showDifficultyPopover, setShowDifficultyPopover] = useState(false);
  const [playerForm, setPlayerForm] = useState({
    name: "",
    initMod: ""
  });
  const [enemyForm, setEnemyForm] = useState({
    name: "",
    qty: "",
    maxHp: "",
    mod: "",
    cr: "",
    color: null,
    advanced: makeDefaultAdvanced()
  });
  const [enemyClipboard, setEnemyClipboard] = useState(null);
  const [npcForm, setNpcForm] = useState({
    name: "",
    qty: "",
    maxHp: "",
    mod: "",
    advanced: makeDefaultAdvanced()
  });
  const [savedEnemyTemplates, setSavedEnemyTemplates] = useState(loadJSON(ENEMY_TEMPLATES_KEY, {}));
  const [showEnemyLibrary, setShowEnemyLibrary] = useState(false);
  const [selectedEnemyTemplate, setSelectedEnemyTemplate] = useState("");
  const [savedNpcTemplates, setSavedNpcTemplates] = useState(loadJSON(NPC_TEMPLATES_KEY, {}));
  const [showNpcLibrary, setShowNpcLibrary] = useState(false);
  const [selectedNpcTemplate, setSelectedNpcTemplate] = useState("");
  const [markerForm, setMarkerForm] = useState({
    name: "",
    initiative: "20"
  });
  const [encounterName, setEncounterName] = useState("");
  const [selectedEncounter, setSelectedEncounter] = useState("");
  const [partyName, setPartyName] = useState("");
  const [selectedParty, setSelectedParty] = useState("");
  const [partyLevel, setPartyLevel] = useState(savedState?.partyLevel || "");
  const [partySize, setPartySize] = useState(savedState?.partySize || "");
  const [rollPlayersInitiative, setRollPlayersInitiative] = useState(savedState?.rollPlayersInitiative || false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const requestConfirm = (message, onConfirm) => setConfirmDialog({
    message,
    onConfirm
  });
  const [showEndInitiativeModal, setShowEndInitiativeModal] = useState(false);
  const currentCardRef = useRef(null);
  const importInputRef = useRef(null);
  const [importError, setImportError] = useState("");
  const [currentCardVisible, setCurrentCardVisible] = useState(true);
  const [roundFlash, setRoundFlash] = useState(false);
  const prevRoundRef = useRef(round);
  useEffect(() => {
    if (prevRoundRef.current !== round) {
      setRoundFlash(true);
      prevRoundRef.current = round;
      const t = setTimeout(() => setRoundFlash(false), 700);
      return () => clearTimeout(t);
    }
  }, [round]);
  const [turnHistory, setTurnHistory] = useState([]);
  useEffect(() => {
    localStorage.setItem(STATE_KEY, JSON.stringify({
      combatants,
      round,
      turnsThisRound,
      inCombat,
      partyLevel,
      partySize,
      rollPlayersInitiative
    }));
  }, [combatants, round, turnsThisRound, inCombat, partyLevel, partySize, rollPlayersInitiative]);
  useEffect(() => {
    localStorage.setItem(ENCOUNTERS_KEY, JSON.stringify(savedEncounters));
  }, [savedEncounters]);
  useEffect(() => {
    localStorage.setItem(PARTIES_KEY, JSON.stringify(savedParties));
  }, [savedParties]);
  useEffect(() => {
    localStorage.setItem(ENEMY_TEMPLATES_KEY, JSON.stringify(savedEnemyTemplates));
  }, [savedEnemyTemplates]);
  useEffect(() => {
    localStorage.setItem(NPC_TEMPLATES_KEY, JSON.stringify(savedNpcTemplates));
  }, [savedNpcTemplates]);
  useEffect(() => {
    if (!inCombat || !currentCardRef.current || typeof IntersectionObserver === "undefined") {
      setCurrentCardVisible(true);
      return;
    }
    const el = currentCardRef.current;
    const obs = new IntersectionObserver(([entry]) => setCurrentCardVisible(entry.isIntersecting), {
      threshold: 0.01
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [inCombat, combatants]);
  const makeMarker = (name, initiative) => ({
    id: uid(),
    type: "marker",
    name,
    initiative,
    conditions: [],
    concentration: INACTIVE_CONCENTRATION
  });
  const makePlayer = (name, initMod) => ({
    id: uid(),
    type: "player",
    name,
    initiative: 10,
    initMod: initMod || 0,
    status: "active",
    conditions: [],
    concentration: INACTIVE_CONCENTRATION,
    deathSaves: {
      success: 0,
      fail: 0
    }
  });
  const addPlayer = () => {
    if (!playerForm.name.trim()) return;
    const mod = parseInt(playerForm.initMod, 10) || 0;
    const c = makePlayer(playerForm.name.trim(), mod);
    setCombatants(prev => inCombat ? insertSorted(prev, c) : setupSort([...prev, c]));
    setPlayerForm({
      name: "",
      initMod: ""
    });
  };
  const buildEnemies = (name, qty, hp, mod, color, cr, existingNames, advanced) => {
    const names = existingNames || new Set();
    const list = [];
    const hasCollision = names.has(name) || nextStartNumber(names, name) > 0;
    if (qty === 1 && !hasCollision) {
      const label = name;
      names.add(label);
      list.push({
        id: uid(),
        type: "enemy",
        name: label,
        initiative: inCombat ? roll20() + mod : null,
        autoRolled: inCombat,
        initMod: mod,
        maxHp: hp,
        currentHp: hp,
        status: "active",
        conditions: [],
        concentration: INACTIVE_CONCENTRATION,
        deathSaves: {
          success: 0,
          fail: 0
        },
        color,
        cr: cr || null,
        advanced: advanced || null
      });
    } else {
      const start = nextStartNumber(names, name) + 1;
      for (let i = 0; i < qty; i++) {
        const label = `${name} ${start + i}`;
        names.add(label);
        list.push({
          id: uid(),
          type: "enemy",
          name: label,
          initiative: inCombat ? roll20() + mod : null,
          autoRolled: inCombat,
          initMod: mod,
          maxHp: hp,
          currentHp: hp,
          status: "active",
          conditions: [],
          concentration: INACTIVE_CONCENTRATION,
          deathSaves: {
            success: 0,
            fail: 0
          },
          color,
          cr: cr || null,
          advanced: advanced || null
        });
      }
    }
    return list;
  };
  const buildNpcs = (name, qty, hp, mod, advanced) => {
    const list = [];
    for (let i = 0; i < qty; i++) {
      const label = qty > 1 ? `${name} ${i + 1}` : name;
      list.push({
        id: uid(),
        type: "npc",
        name: label,
        initiative: inCombat ? roll20() + mod : null,
        autoRolled: inCombat,
        initMod: mod,
        maxHp: hp,
        currentHp: hp,
        status: "active",
        conditions: [],
        concentration: INACTIVE_CONCENTRATION,
        deathSaves: {
          success: 0,
          fail: 0
        },
        color: NPC_COLOR,
        advanced: advanced || null
      });
    }
    return list;
  };
  const addToList = newItems => {
    setCombatants(prev => {
      let next = [...prev];
      newItems.forEach(c => {
        next = inCombat ? insertSorted(next, c) : [...next, c];
      });
      return inCombat ? next : setupSort(next);
    });
  };
  const addEnemies = () => {
    const hp = parseInt(enemyForm.maxHp, 10);
    const mod = parseInt(enemyForm.mod, 10) || 0;
    const qty = clamp(parseInt(enemyForm.qty, 10) || 1, 1, 20);
    if (!enemyForm.name.trim() || isNaN(hp)) return;
    const existingNames = new Set(combatants.filter(c => c.type === "enemy").map(c => c.name));
    const newEnemies = buildEnemies(enemyForm.name.trim(), qty, hp, mod, enemyForm.color, enemyForm.cr.trim(), existingNames, enemyForm.advanced);
    addToList(newEnemies);
    setEnemyForm({
      name: "",
      qty: "",
      maxHp: "",
      mod: "",
      cr: "",
      color: null,
      advanced: makeDefaultAdvanced()
    });
  };

  // Duplicate now works off an explicitly-chosen clipboard (set via the
  // per-card clipboard button) rather than auto-tracking the last add.
  const setClipboardFromCard = c => {
    setEnemyClipboard({
      sourceId: c.id,
      name: c.name,
      maxHp: c.maxHp,
      initMod: c.initMod,
      cr: c.cr,
      advanced: c.advanced
    });
  };
  const duplicateEnemy = () => {
    if (!enemyClipboard) return;
    setEnemyForm({
      name: deriveDuplicateBaseName(enemyClipboard.name),
      qty: "",
      maxHp: String(enemyClipboard.maxHp),
      mod: String(enemyClipboard.initMod || 0),
      cr: enemyClipboard.cr || "",
      color: null,
      advanced: enemyClipboard.advanced || makeDefaultAdvanced()
    });
  };
  const addNpcs = () => {
    const hp = parseInt(npcForm.maxHp, 10);
    const mod = parseInt(npcForm.mod, 10) || 0;
    const qty = clamp(parseInt(npcForm.qty, 10) || 1, 1, 20);
    if (!npcForm.name.trim() || isNaN(hp)) return;
    addToList(buildNpcs(npcForm.name.trim(), qty, hp, mod, npcForm.advanced));
    setNpcForm({
      name: "",
      qty: "",
      maxHp: "",
      mod: "",
      advanced: makeDefaultAdvanced()
    });
  };
  const addMarker = () => {
    if (!markerForm.name.trim()) return;
    const init = parseInt(markerForm.initiative, 10);
    const c = makeMarker(markerForm.name.trim(), isNaN(init) ? 20 : init);
    setCombatants(prev => inCombat ? insertSorted(prev, c) : setupSort([...prev, c]));
    setMarkerForm({
      name: "",
      initiative: "20"
    });
  };
  const pickColor = col => {
    setEnemyForm(f => {
      const remainder = stripLeadingColor(f.name.trim());
      const newName = remainder ? `${col.name} ${remainder}` : col.name;
      return {
        ...f,
        name: newName,
        color: col.hex
      };
    });
  };
  const updateCombatant = (id, patch) => {
    setCombatants(prev => {
      const idx = prev.findIndex(c => c.id === id);
      if (idx === -1) return prev;
      const {
        _revive,
        ...cleanPatch
      } = patch;
      const updated = {
        ...prev[idx],
        ...cleanPatch
      };
      if (_revive) {
        const rest = prev.filter(c => c.id !== id);
        return insertSorted(rest, updated);
      }
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
  };
  const setInitiative = (id, value) => {
    setCombatants(prev => {
      const updated = prev.map(c => c.id === id ? {
        ...c,
        initiative: value
      } : c);
      return inCombat ? sortByInitiative(updated) : updated;
    });
  };
  const removeCombatant = id => setCombatants(prev => prev.filter(c => c.id !== id));
  const clearEnemies = () => {
    requestConfirm("Remove all enemies and markers from the tracker?", () => {
      setCombatants(prev => prev.filter(c => c.type !== "enemy" && c.type !== "marker"));
      // enemyClipboard intentionally survives Clear Enemies — it only resets on Reset All.
    });
  };

  // Flags any still-active, non-expired conditions as "carried over" whenever
  // a fresh Round 1 starts — the one signal we track for "did unaccounted
  // time pass?" instead of a real clock.
  const flagCarriedOverConditions = c => {
    let next = c;
    if (next.conditions && next.conditions.length > 0) {
      next = {
        ...next,
        conditions: next.conditions.map(cond => cond.expired ? cond : {
          ...cond,
          carriedOver: true
        })
      };
    }
    if (next.concentration && next.concentration.active && !next.concentration.expired) {
      next = {
        ...next,
        concentration: {
          ...next.concentration,
          carriedOver: true
        }
      };
    }
    return next;
  };
  const rollInitiative = () => {
    setCombatants(prev => {
      const rolled = prev.map(c => {
        if ((c.type === "enemy" || c.type === "npc") && (c.initiative === null || c.initiative === undefined)) {
          return {
            ...c,
            initiative: roll20() + (c.initMod || 0),
            autoRolled: true
          };
        }
        if (c.type === "player" && rollPlayersInitiative) {
          return {
            ...c,
            initiative: roll20() + (c.initMod || 0),
            autoRolled: true
          };
        }
        return c;
      });
      return sortByInitiative(rolled);
    });
    setInCombat(true);
    setRound(1);
    setTurnsThisRound(0);
    setTurnHistory([]);
  };
  const endInitiative = () => {
    setCombatants(prev => {
      const reverted = prev.map(c => {
        let next = flagCarriedOverConditions(c);
        if ((next.type === "enemy" || next.type === "npc") && next.autoRolled) next = {
          ...next,
          initiative: null,
          autoRolled: false
        };
        if (next.type === "player") next = {
          ...next,
          initiative: 10,
          autoRolled: false
        };
        return next;
      });
      return setupSort(reverted);
    });
    setInCombat(false);
    setRound(1);
    setTurnsThisRound(0);
    setTurnHistory([]);
  };
  const reRollInitiative = () => {
    setCombatants(prev => {
      const rerolled = prev.map(c => {
        let next = flagCarriedOverConditions(c);
        if (next.type === "enemy" || next.type === "npc") {
          next = {
            ...next,
            initiative: roll20() + (next.initMod || 0),
            autoRolled: true
          };
        } else if (next.type === "player" && rollPlayersInitiative) {
          next = {
            ...next,
            initiative: roll20() + (next.initMod || 0),
            autoRolled: true
          };
        }
        return next;
      });
      return sortByInitiative(rerolled);
    });
    setRound(1);
    setTurnsThisRound(0);
    setTurnHistory([]);
  };
  const endTurn = () => {
    const alive = combatants.filter(c => c.status !== "dead");
    if (alive.length === 0) return;
    const aliveCount = alive.length;
    setTurnHistory(h => [...h, {
      combatants,
      round,
      turnsThisRound
    }].slice(-20));
    setCombatants(prev => {
      const aliveNow = prev.filter(c => c.status !== "dead");
      const deadNow = prev.filter(c => c.status === "dead");
      if (aliveNow.length === 0) return prev;
      const [first, ...rest] = aliveNow;
      return [...rest, first, ...deadNow];
    });
    setTurnsThisRound(t => {
      const next = t + 1;
      if (next >= aliveCount) {
        setRound(r => r + 1);
        return 0;
      }
      return next;
    });
  };
  const undoEndTurn = () => {
    setTurnHistory(h => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      setCombatants(last.combatants);
      setRound(last.round);
      setTurnsThisRound(last.turnsThisRound);
      return h.slice(0, -1);
    });
  };
  const resetAll = () => {
    requestConfirm("Reset everything — clear all combatants and end the current fight?", () => {
      setCombatants([]);
      setRound(1);
      setTurnsThisRound(0);
      setInCombat(false);
      setEnemyClipboard(null);
    });
  };
  const saveEncounter = () => {
    const name = encounterName.trim();
    if (!name) return;
    const templates = combatants.filter(c => c.type === "enemy" || c.type === "npc" || c.type === "marker").map(c => {
      if (c.type === "marker") return {
        type: "marker",
        name: c.name,
        initiative: c.initiative
      };
      return {
        type: c.type,
        name: c.name,
        maxHp: c.maxHp,
        initMod: c.initMod || 0,
        color: c.color || null,
        cr: c.cr || null,
        advanced: c.advanced || null
      };
    });
    if (templates.length === 0) return;
    setSavedEncounters(prev => ({
      ...prev,
      [name]: templates
    }));
    setEncounterName("");
  };
  const loadEncounter = () => {
    if (!selectedEncounter || !savedEncounters[selectedEncounter]) return;
    const templates = savedEncounters[selectedEncounter];
    const existingNames = new Set(combatants.filter(c => c.type === "enemy").map(c => c.name));
    const items = templates.flatMap(t => {
      if (t.type === "marker") return [makeMarker(t.name, t.initiative)];
      if (t.type === "npc") return buildNpcs(t.name, 1, t.maxHp, t.initMod, t.advanced);
      return buildEnemies(t.name, 1, t.maxHp, t.initMod, t.color, t.cr, existingNames, t.advanced);
    });
    addToList(items);
  };
  const saveEnemyTemplate = () => {
    const raw = enemyForm.name.trim();
    if (!raw) return;
    const name = stripLeadingColor(raw) || raw;
    setSavedEnemyTemplates(prev => ({
      ...prev,
      [name]: {
        maxHp: enemyForm.maxHp,
        mod: enemyForm.mod,
        cr: enemyForm.cr,
        color: enemyForm.color,
        advanced: enemyForm.advanced
      }
    }));
  };
  const loadEnemyTemplate = name => {
    const t = savedEnemyTemplates[name];
    if (!t) return;
    setEnemyForm(f => ({
      ...f,
      name,
      maxHp: t.maxHp,
      mod: t.mod,
      cr: t.cr,
      color: t.color,
      advanced: t.advanced || makeDefaultAdvanced()
    }));
  };
  const deleteEnemyTemplate = name => {
    requestConfirm(`Delete saved enemy "${name}"? This can't be undone.`, () => {
      setSavedEnemyTemplates(prev => {
        const next = {
          ...prev
        };
        delete next[name];
        return next;
      });
      setSelectedEnemyTemplate("");
    });
  };
  const saveNpcTemplate = () => {
    const name = npcForm.name.trim();
    if (!name) return;
    setSavedNpcTemplates(prev => ({
      ...prev,
      [name]: {
        maxHp: npcForm.maxHp,
        mod: npcForm.mod,
        advanced: npcForm.advanced
      }
    }));
  };
  const loadNpcTemplate = name => {
    const t = savedNpcTemplates[name];
    if (!t) return;
    setNpcForm(f => ({
      ...f,
      name,
      maxHp: t.maxHp,
      mod: t.mod,
      advanced: t.advanced || makeDefaultAdvanced()
    }));
  };
  const deleteNpcTemplate = name => {
    requestConfirm(`Delete saved NPC "${name}"? This can't be undone.`, () => {
      setSavedNpcTemplates(prev => {
        const next = {
          ...prev
        };
        delete next[name];
        return next;
      });
      setSelectedNpcTemplate("");
    });
  };
  const exportData = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      state: {
        combatants,
        round,
        turnsThisRound,
        inCombat,
        partyLevel,
        partySize,
        rollPlayersInitiative
      },
      encounters: savedEncounters,
      parties: savedParties,
      enemyTemplates: savedEnemyTemplates,
      npcTemplates: savedNpcTemplates
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `initlite-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const triggerImport = () => {
    setImportError("");
    if (importInputRef.current) importInputRef.current.click();
  };
  const handleImportFile = e => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      let payload;
      try {
        payload = JSON.parse(ev.target.result);
      } catch (err) {
        setImportError("That file doesn't look like a valid init.Lite backup (not valid JSON).");
        return;
      }
      if (!payload || typeof payload !== "object") {
        setImportError("That file doesn't look like a valid init.Lite backup.");
        return;
      }
      requestConfirm("Import will overwrite all data on this device — combatants, saved parties, encounters, and the enemy/NPC library. Continue?", () => {
        if (payload.state) localStorage.setItem(STATE_KEY, JSON.stringify(payload.state));
        if (payload.encounters) localStorage.setItem(ENCOUNTERS_KEY, JSON.stringify(payload.encounters));
        if (payload.parties) localStorage.setItem(PARTIES_KEY, JSON.stringify(payload.parties));
        if (payload.enemyTemplates) localStorage.setItem(ENEMY_TEMPLATES_KEY, JSON.stringify(payload.enemyTemplates));
        if (payload.npcTemplates) localStorage.setItem(NPC_TEMPLATES_KEY, JSON.stringify(payload.npcTemplates));
        window.location.reload();
      });
    };
    reader.readAsText(file);
  };
  const deleteEncounter = name => {
    requestConfirm(`Delete saved encounter "${name}"? This can't be undone.`, () => {
      setSavedEncounters(prev => {
        const next = {
          ...prev
        };
        delete next[name];
        return next;
      });
      if (selectedEncounter === name) setSelectedEncounter("");
    });
  };
  const saveParty = () => {
    const name = partyName.trim();
    if (!name) return;
    const templates = combatants.filter(c => c.type === "player").map(c => ({
      name: c.name,
      initMod: c.initMod || 0
    }));
    if (templates.length === 0) return;
    setSavedParties(prev => ({
      ...prev,
      [name]: templates
    }));
    setPartyName("");
  };
  const loadParty = () => {
    if (!selectedParty || !savedParties[selectedParty]) return;
    const templates = savedParties[selectedParty];
    addToList(templates.map(t => makePlayer(t.name, t.initMod)));
  };
  const deleteParty = name => {
    requestConfirm(`Delete saved party "${name}"? This can't be undone.`, () => {
      setSavedParties(prev => {
        const next = {
          ...prev
        };
        delete next[name];
        return next;
      });
      if (selectedParty === name) setSelectedParty("");
    });
  };
  const aliveOrder = combatants.filter(c => c.status !== "dead");
  const deadCombatants = combatants.filter(c => c.status === "dead");
  const dividerIndex = inCombat ? clamp(aliveOrder.length - turnsThisRound, 0, aliveOrder.length) : -1;
  const partyCount = partySize.trim() !== "" ? parseInt(partySize, 10) : combatants.filter(c => c.type === "player").length;
  const parsedLevel = parseInt(partyLevel, 10);
  const difficulty = computeDifficulty(combatants.filter(c => c.type === "enemy"), parsedLevel, partyCount);
  const DIFFICULTY_STYLE = {
    Trivial: "bg-neutral-800 text-neutral-400 border-neutral-600",
    Easy: "bg-emerald-900/40 text-emerald-300 border-emerald-700",
    Medium: "bg-amber-900/40 text-amber-300 border-amber-700",
    Hard: "bg-orange-900/40 text-orange-300 border-orange-700",
    Deadly: "bg-rose-900/40 text-rose-300 border-rose-700"
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-2xl mx-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-9 h-9 rounded-lg overflow-hidden shrink-0"
  }, /*#__PURE__*/React.createElement("img", {
    src: LOGO_ICON,
    alt: "",
    className: "w-full h-full object-cover"
  })), /*#__PURE__*/React.createElement("h1", {
    className: "text-lg font-bold tracking-tight"
  }, "init.Lite")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 shrink-0"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowDifficultyPopover(v => !v),
    title: "Encounter difficulty",
    className: `w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-colors ${showDifficultyPopover ? "bg-amber-500 border-amber-400 text-neutral-950" : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-600"}`
  }, /*#__PURE__*/React.createElement(IconScale, {
    className: "w-4 h-4"
  })), /*#__PURE__*/React.createElement(PillSwitch, {
    checked: rollPlayersInitiative,
    onClick: () => setRollPlayersInitiative(v => !v),
    title: "Roll initiative for players"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5 shrink-0"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: clearEnemies,
    disabled: inCombat,
    title: inCombat ? "Can't clear mid-initiative" : "Clear all enemies",
    className: `flex items-center gap-1 text-xs border rounded-lg px-2 py-1.5 whitespace-nowrap ${inCombat ? "text-neutral-600 border-neutral-900 opacity-40 cursor-not-allowed" : "text-neutral-400 hover:text-rose-300 border-neutral-800 hover:border-rose-800"}`
  }, /*#__PURE__*/React.createElement(IconTrash, {
    className: "w-3.5 h-3.5"
  }), " Clear"), /*#__PURE__*/React.createElement("button", {
    onClick: resetAll,
    disabled: inCombat,
    title: inCombat ? "Can't reset mid-initiative" : "Reset everything",
    className: `flex items-center gap-1 text-xs border rounded-lg px-2 py-1.5 whitespace-nowrap ${inCombat ? "text-neutral-600 border-neutral-900 opacity-40 cursor-not-allowed" : "text-neutral-400 hover:text-neutral-200 border-neutral-800 hover:border-neutral-600"}`
  }, /*#__PURE__*/React.createElement(IconRotateCcw, {
    className: "w-3.5 h-3.5"
  }), " Reset"))), showDifficultyPopover && /*#__PURE__*/React.createElement("div", {
    className: "mb-3 rounded-lg border border-amber-900/50 bg-amber-950/10 p-3 space-y-1.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1 text-xs text-neutral-400 shrink-0",
    title: "Average Party Level"
  }, /*#__PURE__*/React.createElement(IconScale, {
    className: "w-3.5 h-3.5"
  }), " Level"), /*#__PURE__*/React.createElement("input", {
    value: partyLevel,
    onChange: e => setPartyLevel(e.target.value),
    placeholder: "e.g. 5",
    inputMode: "numeric",
    className: "w-14 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-amber-500 placeholder:text-neutral-600"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1 text-xs text-neutral-400 shrink-0",
    title: "Party Size"
  }, /*#__PURE__*/React.createElement(IconUsers, {
    className: "w-3.5 h-3.5"
  }), " Size"), /*#__PURE__*/React.createElement("input", {
    value: partySize,
    onChange: e => setPartySize(e.target.value),
    placeholder: "auto",
    inputMode: "numeric",
    className: "w-14 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-amber-500 placeholder:text-neutral-600"
  }))), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-600"
  }, "Enables approximate encounter difficulty. Manual party size for encounter building.")), /*#__PURE__*/React.createElement("div", {
    className: "rounded-xl border border-neutral-800 bg-neutral-900/40 mb-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowEditor(v => !v),
    className: "w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-neutral-300"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement(IconToolbox, {
    className: "w-4 h-4"
  }), " Editor"), /*#__PURE__*/React.createElement(IconChevronDown, {
    className: `w-3.5 h-3.5 transition-transform ${showEditor ? "rotate-180" : ""}`
  })), showEditor && /*#__PURE__*/React.createElement("div", {
    className: "px-3 pb-3 space-y-2"
  }, /*#__PURE__*/React.createElement(EditorSection, {
    title: "Add Player",
    icon: /*#__PURE__*/React.createElement(IconShield, {
      className: "w-4 h-4"
    }),
    accent: {
      border: "border-sky-900/50",
      bg: "bg-sky-950/10",
      text: "text-sky-300"
    },
    open: showPlayerForm,
    onToggle: () => setShowPlayerForm(v => !v)
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5"
  }, /*#__PURE__*/React.createElement("input", {
    value: playerForm.name,
    onChange: e => setPlayerForm({
      ...playerForm,
      name: e.target.value
    }),
    onKeyDown: e => e.key === "Enter" && addPlayer(),
    placeholder: "Name",
    className: "w-2/3 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-sky-500 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("input", {
    value: playerForm.initMod,
    onChange: e => setPlayerForm({
      ...playerForm,
      initMod: e.target.value
    }),
    onKeyDown: e => e.key === "Enter" && addPlayer(),
    placeholder: "+0 (init mod)",
    inputMode: "numeric",
    className: "w-1/3 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-sky-500 placeholder:text-neutral-600"
  })), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-600"
  }, "Starts at initiative 10 — edit anytime on the card. Init mod only applies if \"Roll for Players\" is on."), /*#__PURE__*/React.createElement("button", {
    onClick: addPlayer,
    className: "w-full flex items-center justify-center gap-1 text-sm font-medium bg-sky-600 hover:bg-sky-500 rounded py-1.5"
  }, "+ Add Player")), /*#__PURE__*/React.createElement(EditorSection, {
    title: "Add NPC",
    icon: /*#__PURE__*/React.createElement(IconMask, {
      className: "w-4 h-4"
    }),
    accent: {
      border: "border-stone-600/50",
      bg: "bg-stone-800/10",
      text: "text-stone-300"
    },
    open: showNpcForm,
    onToggle: () => setShowNpcForm(v => !v)
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowNpcLibrary(v => !v),
    className: "flex items-center gap-1 text-xs text-stone-300 hover:text-stone-200"
  }, /*#__PURE__*/React.createElement(IconLibrary, {
    className: "w-3.5 h-3.5"
  }), " Saved NPCs ", /*#__PURE__*/React.createElement(IconChevronDown, {
    className: `w-3 h-3 transition-transform ${showNpcLibrary ? "rotate-180" : ""}`
  })), showNpcLibrary && /*#__PURE__*/React.createElement("div", {
    className: "mt-1.5 rounded-lg border border-neutral-700 bg-neutral-900 p-2 space-y-1.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5"
  }, /*#__PURE__*/React.createElement("select", {
    value: selectedNpcTemplate,
    onChange: e => setSelectedNpcTemplate(e.target.value),
    className: "flex-1 min-w-0 text-xs bg-neutral-950 border border-neutral-700 rounded px-2 py-1 outline-none focus:border-stone-400 text-neutral-200"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Choose…"), Object.keys(savedNpcTemplates).sort((a, b) => a.localeCompare(b)).map(name => /*#__PURE__*/React.createElement("option", {
    key: name,
    value: name
  }, name))), /*#__PURE__*/React.createElement("button", {
    onClick: () => selectedNpcTemplate && loadNpcTemplate(selectedNpcTemplate),
    disabled: !selectedNpcTemplate,
    className: "text-xs px-2 py-1 rounded bg-stone-600 hover:bg-stone-500 disabled:opacity-40 text-white shrink-0"
  }, "Load"), /*#__PURE__*/React.createElement("button", {
    onClick: () => selectedNpcTemplate && deleteNpcTemplate(selectedNpcTemplate),
    disabled: !selectedNpcTemplate,
    className: "text-xs text-neutral-400 hover:text-rose-300 disabled:opacity-40 shrink-0 px-1"
  }, /*#__PURE__*/React.createElement(IconX, {
    className: "w-3.5 h-3.5"
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: saveNpcTemplate,
    disabled: !npcForm.name.trim(),
    className: "w-full flex items-center justify-center gap-1 text-xs px-2 py-1 rounded bg-stone-600 hover:bg-stone-500 disabled:opacity-40 text-white"
  }, /*#__PURE__*/React.createElement(IconSave, {
    className: "w-3.5 h-3.5"
  }), " Save Current As ", npcForm.name.trim() ? `"${npcForm.name.trim()}"` : "…"))), /*#__PURE__*/React.createElement("input", {
    value: npcForm.name,
    onChange: e => setNpcForm({
      ...npcForm,
      name: e.target.value
    }),
    placeholder: "Name",
    className: "w-full text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-stone-400 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5"
  }, /*#__PURE__*/React.createElement("input", {
    value: npcForm.qty,
    onChange: e => setNpcForm({
      ...npcForm,
      qty: e.target.value
    }),
    placeholder: "1 (quantity)",
    inputMode: "numeric",
    className: "w-1/3 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-stone-400 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("input", {
    value: npcForm.maxHp,
    onChange: e => setNpcForm({
      ...npcForm,
      maxHp: e.target.value
    }),
    placeholder: "HP",
    inputMode: "numeric",
    className: "w-1/3 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-stone-400 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("input", {
    value: npcForm.mod,
    onChange: e => setNpcForm({
      ...npcForm,
      mod: e.target.value
    }),
    onKeyDown: e => e.key === "Enter" && addNpcs(),
    placeholder: "+0",
    inputMode: "numeric",
    className: "w-1/3 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-stone-400 placeholder:text-neutral-600"
  })), /*#__PURE__*/React.createElement(AdvancedFieldsEditor, {
    value: npcForm.advanced,
    onChange: adv => setNpcForm({
      ...npcForm,
      advanced: adv
    }),
    accent: "text-stone-300"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: addNpcs,
    className: "w-full flex items-center justify-center gap-1 text-sm font-medium bg-stone-600 hover:bg-stone-500 rounded py-1.5"
  }, "+ Add NPC")), /*#__PURE__*/React.createElement(EditorSection, {
    title: "Add Enemy",
    icon: /*#__PURE__*/React.createElement(IconSwords, {
      className: "w-4 h-4"
    }),
    accent: {
      border: "border-rose-900/50",
      bg: "bg-rose-950/10",
      text: "text-rose-300"
    },
    open: showEnemyForm,
    onToggle: () => setShowEnemyForm(v => !v)
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowEnemyLibrary(v => !v),
    className: "flex items-center gap-1 text-xs text-rose-300 hover:text-rose-200"
  }, /*#__PURE__*/React.createElement(IconLibrary, {
    className: "w-3.5 h-3.5"
  }), " Saved Enemies ", /*#__PURE__*/React.createElement(IconChevronDown, {
    className: `w-3 h-3 transition-transform ${showEnemyLibrary ? "rotate-180" : ""}`
  })), showEnemyLibrary && /*#__PURE__*/React.createElement("div", {
    className: "mt-1.5 rounded-lg border border-neutral-700 bg-neutral-900 p-2 space-y-1.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5"
  }, /*#__PURE__*/React.createElement("select", {
    value: selectedEnemyTemplate,
    onChange: e => setSelectedEnemyTemplate(e.target.value),
    className: "flex-1 min-w-0 text-xs bg-neutral-950 border border-neutral-700 rounded px-2 py-1 outline-none focus:border-rose-500 text-neutral-200"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Choose…"), Object.keys(savedEnemyTemplates).sort((a, b) => a.localeCompare(b)).map(name => /*#__PURE__*/React.createElement("option", {
    key: name,
    value: name
  }, name))), /*#__PURE__*/React.createElement("button", {
    onClick: () => selectedEnemyTemplate && loadEnemyTemplate(selectedEnemyTemplate),
    disabled: !selectedEnemyTemplate,
    className: "text-xs px-2 py-1 rounded bg-rose-700 hover:bg-rose-600 disabled:opacity-40 text-white shrink-0"
  }, "Load"), /*#__PURE__*/React.createElement("button", {
    onClick: () => selectedEnemyTemplate && deleteEnemyTemplate(selectedEnemyTemplate),
    disabled: !selectedEnemyTemplate,
    className: "text-xs text-neutral-400 hover:text-rose-300 disabled:opacity-40 shrink-0 px-1"
  }, /*#__PURE__*/React.createElement(IconX, {
    className: "w-3.5 h-3.5"
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: saveEnemyTemplate,
    disabled: !enemyForm.name.trim(),
    className: "w-full flex items-center justify-center gap-1 text-xs px-2 py-1 rounded bg-rose-700 hover:bg-rose-600 disabled:opacity-40 text-white"
  }, /*#__PURE__*/React.createElement(IconSave, {
    className: "w-3.5 h-3.5"
  }), " Save Current As ", enemyForm.name.trim() ? `"${stripLeadingColor(enemyForm.name.trim()) || enemyForm.name.trim()}"` : "…"))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-1.5"
  }, ENEMY_COLORS.map(col => /*#__PURE__*/React.createElement("button", {
    key: col.name,
    title: col.name,
    onClick: () => pickColor(col),
    className: `w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${enemyForm.color === col.hex ? "border-amber-400 ring-2 ring-amber-400 scale-110" : "border-neutral-700"}`,
    style: {
      backgroundColor: col.hex
    }
  }))), /*#__PURE__*/React.createElement("input", {
    value: enemyForm.name,
    onChange: e => setEnemyForm({
      ...enemyForm,
      name: e.target.value
    }),
    placeholder: "Name (or pick a color)",
    className: "w-full text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-rose-500 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5"
  }, /*#__PURE__*/React.createElement("input", {
    value: enemyForm.qty,
    onChange: e => setEnemyForm({
      ...enemyForm,
      qty: e.target.value
    }),
    placeholder: "1 (quantity)",
    inputMode: "numeric",
    className: "w-1/3 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-rose-500 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("input", {
    value: enemyForm.maxHp,
    onChange: e => setEnemyForm({
      ...enemyForm,
      maxHp: e.target.value
    }),
    placeholder: "HP",
    inputMode: "numeric",
    className: "w-1/3 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-rose-500 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("input", {
    value: enemyForm.mod,
    onChange: e => setEnemyForm({
      ...enemyForm,
      mod: e.target.value
    }),
    onKeyDown: e => e.key === "Enter" && addEnemies(),
    placeholder: "+0 (init mod)",
    inputMode: "numeric",
    className: "w-1/3 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-rose-500 placeholder:text-neutral-600"
  })), /*#__PURE__*/React.createElement(AdvancedFieldsEditor, {
    value: enemyForm.advanced,
    onChange: adv => setEnemyForm({
      ...enemyForm,
      advanced: adv
    }),
    accent: "text-rose-300",
    cr: enemyForm.cr,
    onCrChange: v => setEnemyForm({
      ...enemyForm,
      cr: v
    })
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: addEnemies,
    className: "flex-1 flex items-center justify-center gap-1 text-sm font-medium bg-rose-600 hover:bg-rose-500 rounded py-1.5"
  }, "+ Add Enemy"), enemyClipboard && /*#__PURE__*/React.createElement("button", {
    onClick: duplicateEnemy,
    title: "Duplicate from clipboard",
    className: "px-3 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 text-sm shrink-0 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(IconClipboard, {
    className: "w-4 h-4"
  })))), /*#__PURE__*/React.createElement(EditorSection, {
    title: "Add Marker",
    icon: /*#__PURE__*/React.createElement(IconFlag, {
      className: "w-4 h-4"
    }),
    accent: {
      border: "border-indigo-900/50",
      bg: "bg-indigo-950/10",
      text: "text-indigo-300"
    },
    open: showMarkerForm,
    onToggle: () => setShowMarkerForm(v => !v)
  }, /*#__PURE__*/React.createElement("input", {
    value: markerForm.name,
    onChange: e => setMarkerForm({
      ...markerForm,
      name: e.target.value
    }),
    placeholder: "e.g. Lair Actions",
    className: "w-full text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-indigo-500 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-neutral-500 shrink-0"
  }, "Initiative"), /*#__PURE__*/React.createElement("input", {
    value: markerForm.initiative,
    onChange: e => setMarkerForm({
      ...markerForm,
      initiative: e.target.value
    }),
    onKeyDown: e => e.key === "Enter" && addMarker(),
    inputMode: "numeric",
    className: "w-16 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-indigo-500"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-600"
  }, "Defaults to 20 — edit anytime on the card.")), /*#__PURE__*/React.createElement("button", {
    onClick: addMarker,
    className: "w-full flex items-center justify-center gap-1 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 rounded py-1.5"
  }, /*#__PURE__*/React.createElement(IconFlag, {
    className: "w-4 h-4"
  }), " Add Marker")), /*#__PURE__*/React.createElement(EditorSection, {
    title: "Saved Encounters",
    icon: /*#__PURE__*/React.createElement(IconBookOpen, {
      className: "w-4 h-4"
    }),
    accent: {
      border: "border-violet-900/50",
      bg: "bg-violet-950/10",
      text: "text-violet-300"
    },
    open: showEncounterForm,
    onToggle: () => setShowEncounterForm(v => !v)
  }, /*#__PURE__*/React.createElement("input", {
    value: encounterName,
    onChange: e => setEncounterName(e.target.value),
    placeholder: "Name this encounter",
    className: "w-full text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-violet-500 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: saveEncounter,
    className: "w-full text-sm font-medium bg-violet-700 hover:bg-violet-600 rounded py-1.5"
  }, "Save current enemies & NPCs"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5"
  }, /*#__PURE__*/React.createElement("select", {
    value: selectedEncounter,
    onChange: e => setSelectedEncounter(e.target.value),
    className: "flex-1 min-w-0 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-violet-500 text-neutral-200"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Choose…"), Object.keys(savedEncounters).map(name => /*#__PURE__*/React.createElement("option", {
    key: name,
    value: name
  }, name, " (", savedEncounters[name].length, ")"))), /*#__PURE__*/React.createElement("button", {
    onClick: loadEncounter,
    disabled: !selectedEncounter,
    className: "text-sm font-medium bg-violet-700 hover:bg-violet-600 disabled:opacity-40 rounded px-3 py-1.5 shrink-0"
  }, "Load"), /*#__PURE__*/React.createElement("button", {
    onClick: () => selectedEncounter && deleteEncounter(selectedEncounter),
    disabled: !selectedEncounter,
    className: "text-sm text-neutral-400 hover:text-rose-300 disabled:opacity-40 rounded px-2 py-1.5 shrink-0 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(IconX, {
    className: "w-4 h-4"
  })))), /*#__PURE__*/React.createElement(EditorSection, {
    title: "Saved Parties",
    icon: /*#__PURE__*/React.createElement(IconUsers, {
      className: "w-4 h-4"
    }),
    accent: {
      border: "border-teal-900/50",
      bg: "bg-teal-950/10",
      text: "text-teal-300"
    },
    open: showPartyForm,
    onToggle: () => setShowPartyForm(v => !v)
  }, /*#__PURE__*/React.createElement("input", {
    value: partyName,
    onChange: e => setPartyName(e.target.value),
    placeholder: "Name this party",
    className: "w-full text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-teal-500 placeholder:text-neutral-600"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: saveParty,
    className: "w-full text-sm font-medium bg-teal-700 hover:bg-teal-600 rounded py-1.5"
  }, "Save current players"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1.5"
  }, /*#__PURE__*/React.createElement("select", {
    value: selectedParty,
    onChange: e => setSelectedParty(e.target.value),
    className: "flex-1 min-w-0 text-sm bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 outline-none focus:border-teal-500 text-neutral-200"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Choose…"), Object.keys(savedParties).map(name => /*#__PURE__*/React.createElement("option", {
    key: name,
    value: name
  }, name, " (", savedParties[name].length, ")"))), /*#__PURE__*/React.createElement("button", {
    onClick: loadParty,
    disabled: !selectedParty,
    className: "text-sm font-medium bg-teal-700 hover:bg-teal-600 disabled:opacity-40 rounded px-3 py-1.5 shrink-0"
  }, "Load"), /*#__PURE__*/React.createElement("button", {
    onClick: () => selectedParty && deleteParty(selectedParty),
    disabled: !selectedParty,
    className: "text-sm text-neutral-400 hover:text-rose-300 disabled:opacity-40 rounded px-2 py-1.5 shrink-0 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(IconX, {
    className: "w-4 h-4"
  })))), /*#__PURE__*/React.createElement(EditorSection, {
    title: "Backup & Restore",
    icon: /*#__PURE__*/React.createElement(IconSave, {
      className: "w-4 h-4"
    }),
    accent: {
      border: "border-neutral-700/50",
      bg: "bg-neutral-800/20",
      text: "text-neutral-300"
    },
    open: showBackupForm,
    onToggle: () => setShowBackupForm(v => !v)
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-600"
  }, "Move everything — combatants, saved parties, encounters, and the enemy/NPC library — between your devices as a file."), /*#__PURE__*/React.createElement("button", {
    onClick: exportData,
    className: "w-full flex items-center justify-center gap-1 text-sm font-medium bg-neutral-700 hover:bg-neutral-600 rounded py-1.5"
  }, /*#__PURE__*/React.createElement(IconDownload, {
    className: "w-4 h-4"
  }), " Export Data"), /*#__PURE__*/React.createElement("button", {
    onClick: triggerImport,
    className: "w-full flex items-center justify-center gap-1 text-sm font-medium bg-neutral-700 hover:bg-neutral-600 rounded py-1.5"
  }, /*#__PURE__*/React.createElement(IconUpload, {
    className: "w-4 h-4"
  }), " Import Data"), /*#__PURE__*/React.createElement("input", {
    ref: importInputRef,
    type: "file",
    accept: ".json,application/json",
    onChange: handleImportFile,
    className: "hidden"
  }), importError && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-rose-400"
  }, importError)))), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-neutral-500 text-center my-3"
  }, inCombat ? /*#__PURE__*/React.createElement(React.Fragment, null, "Round ", /*#__PURE__*/React.createElement("span", {
    className: `font-bold transition-colors duration-700 ${roundFlash ? "text-amber-400" : "text-neutral-500"}`
  }, round), " · ") : "Setting up · ", combatants.length, " combatant", combatants.length !== 1 ? "s" : ""), difficulty && /*#__PURE__*/React.createElement("div", {
    className: `w-full mb-3 flex items-center justify-between text-xs rounded-lg border px-3 py-2 ${DIFFICULTY_STYLE[difficulty.band]}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1 font-semibold"
  }, /*#__PURE__*/React.createElement(IconScale, {
    className: "w-3.5 h-3.5"
  }), " ", difficulty.band, " encounter"), /*#__PURE__*/React.createElement("span", {
    className: "font-mono opacity-80"
  }, "~", difficulty.adjustedXP, " adj. XP ", difficulty.missingCr > 0 ? `(${difficulty.missingCr} enemy w/o CR)` : "")), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 mb-5"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: inCombat ? () => setShowEndInitiativeModal(true) : rollInitiative,
    className: `flex-1 flex items-center justify-center gap-1.5 text-sm font-bold rounded-lg py-2.5 transition-colors ${inCombat ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700" : "bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-neutral-950"}`
  }, inCombat ? /*#__PURE__*/React.createElement(IconStop, {
    className: "w-4 h-4"
  }) : /*#__PURE__*/React.createElement(IconD20, {
    className: "w-4 h-4"
  }), " ", inCombat ? "End Initiative" : "Roll Initiative"), inCombat && /*#__PURE__*/React.createElement("button", {
    onClick: undoEndTurn,
    disabled: turnHistory.length === 0,
    title: "Undo last End Turn",
    className: `px-4 rounded-lg border transition-colors flex items-center justify-center ${turnHistory.length === 0 ? "opacity-30 cursor-not-allowed border-neutral-800 text-neutral-600" : "border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-500 hover:text-neutral-100"}`
  }, /*#__PURE__*/React.createElement(IconUndo, {
    className: "w-4 h-4"
  }))), inCombat && !currentCardVisible && aliveOrder[0] && /*#__PURE__*/React.createElement("div", {
    className: "fixed top-0 left-0 right-0 z-20 bg-amber-500 text-neutral-950 px-4 py-2 flex items-center justify-between shadow-lg"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1 text-sm font-bold truncate"
  }, /*#__PURE__*/React.createElement(IconChevronRight, {
    className: "w-4 h-4 shrink-0"
  }), " ", aliveOrder[0].name, "'s turn"), /*#__PURE__*/React.createElement("button", {
    onClick: endTurn,
    className: "text-xs font-bold bg-neutral-950 text-amber-400 rounded px-3 py-1.5 shrink-0 ml-2"
  }, "End Turn")), combatants.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-16 text-neutral-600 border border-dashed border-neutral-800 rounded-xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl mb-2 opacity-50"
  }, "♥"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm"
  }, "Add combatants to begin the encounter.")) : /*#__PURE__*/React.createElement("div", {
    className: "space-y-2.5"
  }, aliveOrder.map((c, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: c.id
  }, i === dividerIndex && /*#__PURE__*/React.createElement(RoundDivider, null), /*#__PURE__*/React.createElement(CombatantCard, {
    c: c,
    isCurrent: i === 0,
    inCombat: inCombat,
    cardRef: i === 0 ? currentCardRef : null,
    onUpdate: patch => updateCombatant(c.id, patch),
    onRemove: () => removeCombatant(c.id),
    onEndTurn: endTurn,
    onInitChange: val => setInitiative(c.id, val),
    onSetClipboard: () => setClipboardFromCard(c)
  }))), dividerIndex === aliveOrder.length && aliveOrder.length > 0 && /*#__PURE__*/React.createElement(RoundDivider, null), deadCombatants.map(c => /*#__PURE__*/React.createElement(CombatantCard, {
    key: c.id,
    c: c,
    isCurrent: false,
    inCombat: inCombat,
    onUpdate: patch => updateCombatant(c.id, patch),
    onRemove: () => removeCombatant(c.id),
    onEndTurn: endTurn,
    onInitChange: val => setInitiative(c.id, val),
    onSetClipboard: () => setClipboardFromCard(c)
  })))), confirmDialog && /*#__PURE__*/React.createElement(ConfirmModal, {
    message: confirmDialog.message,
    onCancel: () => setConfirmDialog(null),
    onConfirm: () => {
      confirmDialog.onConfirm();
      setConfirmDialog(null);
    }
  }), showEndInitiativeModal && /*#__PURE__*/React.createElement(EndInitiativeModal, {
    onEnd: () => {
      endInitiative();
      setShowEndInitiativeModal(false);
    },
    onReroll: () => {
      reRollInitiative();
      setShowEndInitiativeModal(false);
    },
    onCancel: () => setShowEndInitiativeModal(false)
  }));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(CombatTracker, null));